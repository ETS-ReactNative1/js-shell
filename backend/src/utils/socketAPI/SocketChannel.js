const EventEmitter = require('events');
const makeUUID = require('uuidv4');

const EVT_CONNECT = 'connect';
const EVT_BEFORE_DISCONNECT = 'beforeDisconnect';
const EVT_DISCONNECT = 'disconnect';

/**
 * Client / Server layered communications on top of Socket.io socket.
 * 
 * It's like a virtual socket on a socket, w/ it's own event connect /
 * disconnect events.
 */
class SocketChannel extends EventEmitter {
  /**
   * @param {Object} socket socket.io socket.
   * @param {string} channelID? If null, this instance is the host instance.
   */
  constructor(socket, channelID = null) {
    super();

    this._socket = socket;

    this._channelID = channelID || `socketChannel/${makeUUID()}`;

    this._init();

    this.emit(EVT_CONNECT);
  }

  getChannelID() {
    return this._channelID;
  }

  _init() {
    this._socket.on(this.getChannelID(), this._handleRawSocketData.bind(this));
  }

  _deinit() {
    this._socket.off(this.getChannelID(), this._handleRawSocketData.bind(this));
  }

  emit(evtName, data) {
    /*
    console.log('emit', {
      evtName,
      data
    });
    */

    // Send event over Socket.io
    this._socket.emit(this.getChannelID(), {
      evtName,
      data
    });
  }

  write(data) {
    return this.emit('data', data);
  }

  _handleRawSocketData(socketData) {
    const { evtName, data} = socketData;

    /*
    console.log('receive', {
      evtName,
      data
    });
    */
    
    // Pass underneath this instance, so we don't re-emit over Socket.io
    super.emit(evtName, data);
  };

  disconnect() {
    this.emit(EVT_BEFORE_DISCONNECT);

    // Remove all listeners to the channel
    this.removeAllListeners();

    // Stop the Socket.io from listening
    this._deinit();
  }
}

module.exports = {
  SocketChannel,
  EVT_BEFORE_DISCONNECT,
  EVT_DISCONNECT
};