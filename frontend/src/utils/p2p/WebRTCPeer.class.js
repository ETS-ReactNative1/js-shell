// TODO: Automatically disconnect when Peer disconnects (or loses connection)

import EventEmitter from 'events';
import Peer from './Peer.class';
import SimplePeer from 'simple-peer';
import {
  createSocketPeerDataPacket,
  sendSocketPeerDataPacket
} from './socketPeer';
import sleep from 'utils/sleep';

export const SOCKET_PEER_WEB_RTC_SIGNAL_PACKET_TYPE = 'webRTCSignal';

// Emitted between Peers when one wishes to disconnect
export const EVT_REQUEST_DISCONNECT = 'requestDisconnect';

export const EVT_CONNECT = 'connect';
export const EVT_DATA = 'data';
export const EVT_CONNECT_ERROR = 'connectError';
export const EVT_DISCONNECT = 'disconnect';

class WebRTCPeer extends EventEmitter {
  /**
   * Initiates a WebRTC connection with the given Peer.
   * 
   * @param {Peer} remotePeer 
   * @param {MediaStream} mediaStream 
   */
  static async initiateConnection(remotePeer, mediaStream = null) {
    try {
      let webRTCPeer = remotePeer.getWebRTCPeer();
      if (!webRTCPeer) {
        webRTCPeer = new WebRTCPeer(remotePeer);
      }

      await webRTCPeer.connect(true, mediaStream);

      return webRTCPeer;
    } catch (exc) {
      throw exc;
    }
  }

  /**
   * 
   * @param {SocketPeerDataPacket} webRTCSignalDataPacket 
   */
  static async handleReceivedSignalDataPacket(webRTCSignalDataPacket) {
    try {
      const { fromPeerId, data: signalData } = webRTCSignalDataPacket;
      const remotePeer = Peer.getPeerWithId(fromPeerId);
      if (!remotePeer) {
        console.error(`Remote peer does not exist in cache with id: ${fromPeerId}`);
        return;
      }

      let webRTCPeer = remotePeer.getWebRTCPeer();
      if (!webRTCPeer) {
        webRTCPeer = new WebRTCPeer(remotePeer);
      }

      if (!webRTCPeer.getIsConnecting() && !webRTCPeer.getIsConnected()) {
        await webRTCPeer.connect(false); // TODO: Handle media stream
      }

      webRTCPeer.signal(signalData);
    } catch (exc) {
      throw exc;
    }
  }

  /**
   * Disconnects the WebRTC connection from the given Peer.
   * 
   * @param {Peer} remotePeer 
   */
  static async disconnectConnection(remotePeer) {
    try {
      let webRTCPeer = remotePeer.getWebRTCPeer();
      if (webRTCPeer) {
        await webRTCPeer.disconnect();
      }
    } catch (exc) {
      throw exc;
    }
  }

  /**
   * @param {Peer} remotePeer 
   */
  constructor(remotePeer) {
    super();

    this._remotePeer = remotePeer;
    this._remotePeer.setWebRTCPeer(this);

    this._simplePeer = null;

    this._isConnected = false;
    this._isConnecting = false;
  }

  async connect(asInitiator = null, mediaStream = null) {
    try {
      if (this._isConnecting) {
        console.warn('Aborted connect attempt because it is already in a connecting state');

        return;
      }

      if (this._isConnected) {
        await this.disconnect();

        // Pause to let the other peer sync up
        await sleep(1000);
      }

      this._isConnecting = true;

      this._simplePeer = null;

      if (asInitiator !== null) {
        this._isInitiator = asInitiator;
      }

      const remotePeerId = this._remotePeer.getPeerId();

      this._simplePeer = new SimplePeer({
        initiator: this._isInitiator,
        // stream: this._mediaStream
      });

      this._simplePeer.on('signal', signalData => {
        const dataPacket = createSocketPeerDataPacket(remotePeerId, SOCKET_PEER_WEB_RTC_SIGNAL_PACKET_TYPE, signalData);
        sendSocketPeerDataPacket(dataPacket);

        console.debug(`Received signal from peer with id: ${remotePeerId}`);
      });

      this._simplePeer.on('connect', () => {
        this._isConnecting = false;
        this._isConnected = true;

        this.emit(EVT_CONNECT);

        console.debug(`WebRTC connected to remote peer with id: ${remotePeerId}`);

        // TODO: Remove
        this._simplePeer.send('Hello');
      });

      this._simplePeer.on('data', data => {
        console.debug(`WebRTC connection received data from peer with id: ${remotePeerId}`, data);

        this.emit(EVT_DATA);

        // Checking data length before trying to convert data to string
        if (data.length === EVT_REQUEST_DISCONNECT.length &&
          data.toString() === EVT_REQUEST_DISCONNECT) {
          this.disconnect();
        }
      });

      this._simplePeer.on('error', err => {
        this.emit(EVT_CONNECT_ERROR, err);
        
        console.error(`WebRTC connection has errored with peer with id: ${remotePeerId}`, {
          err
        });
      });

      this._simplePeer.on('close', () => {
        this._isConnecting = false;
        this._isConnected = false;

        this._simplePeer.removeAllListeners();

        this.emit(EVT_DISCONNECT);

        this._simplePeer = null;

        console.debug(`WebRTC connection has closed from peer with id: ${remotePeerId}`);
      });

    } catch (exc) {
      throw exc;
    }
  }

  /**
   * Retrieves whether or not the WebRTCPeer is currently connectED.
   * 
   * @return {boolean}
   */
  getIsConnected() {
    return this._isConnected;
  }

  /**
   * Retrieves whether or not the WebRTCPeer is currently connectING.
   * 
   * @return {boolean}
   */
  getIsConnecting() {
    return this._isConnecting;
  }

  signal(signalData) {
    try {
      this._simplePeer.signal(signalData);
    } catch (exc) {
      console.error(exc);
    }
  }

  /**
   * @return {Promise<void>}
   */
  disconnect() {
    if (this._simplePeer) {
      if (this._isConnected) {
        this._simplePeer.send(EVT_REQUEST_DISCONNECT);
      }

      return new Promise((resolve, reject) => {
        this._simplePeer.once('close', () => {

          // Note: EVT_DISCONNECT is emitted directly within simplePeer close handler

          resolve();
        });

        this._simplePeer.destroy();
      });
    }
  }
}

export default WebRTCPeer;