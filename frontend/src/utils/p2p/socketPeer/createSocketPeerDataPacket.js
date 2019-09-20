import 'shared/p2p/SocketPeerDataPacket.typedef';
import uuidv4 from 'uuidv4';
import { getSocketID } from 'utils/socket.io';

/**
 * Creates a new data packet to be utilized for sending a message to another
 * SocketPeer connection.
 * 
 * IMPORTANT! This requires the usage of sendSocketPeerDataPacket in order to
 * transmit.
 * 
 * @param {string} toSocketPeerID 
 * @param {any} messageData 
 * @param {boolean} isReceivedReceiptRequested
 * 
 * @return {SocketPeerDataPacket} 
 */
const createSocketPeerDataPacket = (toSocketPeerID, packetType, data, isReceivedReceiptRequested = false) => {
  const fromSocketPeerID = getSocketID();

  if (!fromSocketPeerID) {
    throw new Error('Socket is not connected. Cannot create a new Socket Peer data packet.');
  }
  
  // A unique identifier for this data packet
  const packetUUID = uuidv4();

  return {
    toSocketPeerID,
    fromSocketPeerID,
    packetUUID,
    packetType,
    data,
    isReceivedReceiptRequested
  };
};

export default createSocketPeerDataPacket;