import LinkedState, { EVT_LINKED_STATE_UPDATE } from './LinkedState';

export {
  EVT_LINKED_STATE_UPDATE
};

export const P2P_LINKED_STATE_SCOPE_NAME = 'p2pConnections';

export const STATE_REMOTE_PEERS = 'remotePeers';
export const STATE_LAST_UPDATED_PEER = 'lastUpdatedPeer';
export const STATE_CHAT_MESSAGES = 'chatMessages';
export const STATE_INCOMING_CALL_REQUESTS = 'incomingCallRequests';
export const STATE_LAST_INCOMING_CALL_REQUEST_RESPONSE = 'lastIncomingCallRequestResponse';

// Peer actions
export const ACTION_ADD_REMOTE_PEER = 'addRemotePeer';
export const ACTION_REMOVE_REMOTE_PEER_WITH_ID = 'removeRemotePeerWithId';
export const ACTION_SET_LAST_UPDATED_PEER = 'notifyPeerUpdate';

// Chat message actions
export const ACTION_ADD_CHAT_MESSAGE = 'addChatMessage';
export const ACTION_GET_CHAT_MESSAGES = 'getChatMessages';
export const ACTION_GET_LAST_CHAT_MESSAGE_TO_OR_FROM_PEER_ID = 'getLastChatMessageToOrFromPeerId';
export const ACTION_GET_CHAT_MESSAGE_WITH_UUID = 'getChatMessageWithUuid';
export const ACTION_UPDATE_CHAT_MESSAGE_WITH_UUID = 'updateChatMessageWithUuid';

// Call actions
export const ACTION_ADD_INCOMING_CALL_REQUEST = 'addIncomingCallRequest';
export const ACTION_REMOVE_INCOMING_CALL_REQUEST = 'removeIncomingCallRequest';
export const ACTION_SET_LAST_INCOMING_CALL_REQUEST_RESPONSE = 'setLastIncomingCallRequestResponse';

/**
 * Manages peer-to-peer (P2P) connectivity.
 * 
 * @extends LinkedState
 */
export default class P2PLinkedState extends LinkedState {
  constructor() {
    super(P2P_LINKED_STATE_SCOPE_NAME, {
      [STATE_REMOTE_PEERS]: [],

      [STATE_LAST_UPDATED_PEER]: null,

      [STATE_CHAT_MESSAGES]: [],

      [STATE_INCOMING_CALL_REQUESTS]: [],

      [STATE_LAST_INCOMING_CALL_REQUEST_RESPONSE]: {}
    }, {
      actions: {
        // Adds a chat message to the log
        // Important: This should only be called by the ChatMessage class
        [ACTION_ADD_CHAT_MESSAGE]: (chatMessage) => {
          if (!chatMessage) {
            console.warn('chatMessage does not exist');
            return;
          }

          const currentChatMessages = this.getState(STATE_CHAT_MESSAGES);

          currentChatMessages.push(chatMessage);

          this.setState({
            [STATE_CHAT_MESSAGES]: currentChatMessages
          });
        },

        [ACTION_GET_CHAT_MESSAGES]: (withFilter = null) => {
          let chatMessages = this.getState(STATE_CHAT_MESSAGES);

          if (typeof withFilter === 'function') {
            chatMessages = chatMessages.filter(withFilter);
          }

          return chatMessages;
        },

        /**
         * @param {string} peerId
         * @return {ChatMessage}
         */
        [ACTION_GET_LAST_CHAT_MESSAGE_TO_OR_FROM_PEER_ID]: (peerId) => {
          const chatMessages = this.getState(STATE_CHAT_MESSAGES);
          const lenChatMessages = chatMessages.length;

          for (let i = lenChatMessages - 1; i >= 0; i--) {
            const testChatMessage = chatMessages[i];

            // Skip non-finalized messages
            if (!testChatMessage.getIsFinalized()) {
              continue;
            }

            if (testChatMessage.getToPeerId() === peerId) {
              return testChatMessage;
            }

            if (testChatMessage.getFromPeerId() === peerId) {
              return testChatMessage;
            }
          }
        },

        [ACTION_GET_CHAT_MESSAGE_WITH_UUID]: (chatMessageUuid) => {
          const chatMessages = this.getState(STATE_CHAT_MESSAGES);
          const lenChatMessages = chatMessages.length;

          // Walk backwards
          for (let i = lenChatMessages - 1; i >= 0; i--) {
            const testChatMessageUuid = chatMessages[i].getUuid();
            if (testChatMessageUuid === chatMessageUuid) {
              return chatMessages[i];
            }
          }
        },

        /**
         * Updates an existing chat message with updated data.
         */
        [ACTION_UPDATE_CHAT_MESSAGE_WITH_UUID]: (chatMessageUuid, updateHandler) => {
          if (typeof updateHandler !== 'function') {
            throw new Error('updateHandler is not a function');
          }

          let chatMessages = this.getState(STATE_CHAT_MESSAGES);

          chatMessages = chatMessages.map(chatMessage => {
            const testChatMessageUuid = chatMessage.getUuid();

            if (testChatMessageUuid === chatMessageUuid) {
              // IMPORTANT! updateHandler must return the chatMessage or it will be undefined
              chatMessage = updateHandler(chatMessage);

              if (!chatMessage) {
                throw new Error('chatMessage not returned from updateHandler');
              }
            }

            return chatMessage;
          });

          this.setState({
            [STATE_CHAT_MESSAGES]: chatMessages
          });
        },

        [ACTION_ADD_REMOTE_PEER]: (remotePeer) => {
          const remotePeers = this.getState(STATE_REMOTE_PEERS);

          remotePeers.push(remotePeer);

          this.setState({
            [STATE_REMOTE_PEERS]: remotePeers
          });
        },

        [ACTION_REMOVE_REMOTE_PEER_WITH_ID]: (remotePeerId) => {
          let remotePeers = this.getState(STATE_REMOTE_PEERS);
          remotePeers = remotePeers.filter(testRemotePeer => {
            const testRemotePeerId = testRemotePeer.getPeerId();

            return testRemotePeerId !== remotePeerId;
          });

          this.setState({
            [STATE_REMOTE_PEERS]: remotePeers
          });
        },

        [ACTION_SET_LAST_UPDATED_PEER]: (peer) => {
          this.setState({
            [STATE_LAST_UPDATED_PEER]: peer
          });
        }
      }
    });
  }
}