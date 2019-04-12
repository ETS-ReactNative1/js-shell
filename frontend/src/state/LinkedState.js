import EventEmitter from 'events';
import { isNull } from 'util';
const uuidv4 = require('uuid/v4');

export const DEFAULT_LINKED_SCOPE_NAME = 'default-shared';

// Master controller events
export const EVT_BROADCAST_STATE_UPDATE = 'broadcast-state-update';
export const EVT_ADDED_LINKED_STATE = 'added-linked-state';
export const EVT_UPDATED_SHARED_STATE = 'updated-shared-state';

// Switched to true after MasterLinkedStateControllerSingleton is instantiated
let _mlscsIsInstantiated = false;

class MasterLinkedStateControllerSingleton extends EventEmitter {
  _linkedStateInstances = [];
  _sharedStates = {};
  _masterLinkedStateListener = null;

  constructor() {
    if (_mlscsIsInstantiated) {
      throw new Error('MasterLinkedStateControllerSingleton can only be instantiated once');
    }

    super();

    _mlscsIsInstantiated = true;

    // Script needs to instantiate before master linked state listener is present
    setTimeout(() => {
      this._masterLinkedStateListener = new MasterLinkedStateListener();
      this._masterLinkedStateListener.setState({
        mlscs: this
      });
    }, 1);
  }

  addLinkedState(linkedState, initialDefaultState = {}) {
    if (!(linkedState instanceof LinkedState)) {
      throw new Error('linkedState must be an instance of LinkedState');
    }

    const linkedScopeName = linkedState.getLinkedScopeName();

    // Keep record of class internally
    this._linkedStateInstances.push(linkedState);

    let isOriginalInstance = null;

    // Register initial default state
    if (typeof this._sharedStates[linkedScopeName] === 'undefined') {
      this._sharedStates[linkedScopeName] = initialDefaultState;
      isOriginalInstance = true;
    } else {
      isOriginalInstance = false;
    }

    linkedState.setIsOriginalInstance(isOriginalInstance, this);

    if (this._masterLinkedStateListener) {
      this._masterLinkedStateListener.broadcast(EVT_ADDED_LINKED_STATE, {
        linkedState,
        _rawDate: new Date(),
        _rawCallStack: new Error()
      });
    }
  }

  setSharedState(linkedState, updatedStateWithMetadata) {
    const linkedScopeName = linkedState.getLinkedScopeName();

    const {updatedState} = updatedStateWithMetadata;

    this._sharedStates[linkedScopeName] = Object.assign(this._sharedStates[linkedScopeName], updatedState);

    this.broadcast(linkedState, EVT_BROADCAST_STATE_UPDATE, updatedState);

    if (this._masterLinkedStateListener) {
      this._masterLinkedStateListener.broadcast(EVT_UPDATED_SHARED_STATE, {
        linkedState,
        ...updatedStateWithMetadata
        // callStack: new Error().stack
      });
    }
  }

  getSharedState(linkedState) {
    const linkedScopeName = linkedState.getLinkedScopeName();

    return this._sharedStates[linkedScopeName];
  }

  broadcast(linkedState, eventName, ...args) {
    const linkedScopeName = linkedState.getLinkedScopeName();

    const broadcastInstances = this.getLinkedStateInstancesByScopeName(linkedScopeName);

    broadcastInstances.forEach((instance) => {
      instance.emit(eventName, ...args);
    });
  }

  getLinkedStateInstances(linkedState = null) {
    if (isNull(linkedState)) {
      return this._linkedStateInstances;
    } else {
      const linkedScopeName = linkedState.getLinkedScopeName();

      return this.getLinkedStateInstancesByScopeName(linkedScopeName);
    }
  }
  
  getLinkedStateInstancesByScopeName(linkedScopeName) {
    return this._linkedStateInstances.filter((testInstance) => {
      const testLinkedScopeName = testInstance.getLinkedScopeName();
      if (testLinkedScopeName !== linkedScopeName) {
        return false;
      }
  
      return true;
    });
  }

  getLinkedStateReferenceCount(linkedState) {
    const linkedScopeName = linkedState.getLinkedScopeName();

    const linkedStateInstances = this.getLinkedStateInstancesByScopeName(linkedScopeName);

    return linkedStateInstances.length;
  }
}

const mlscs = new MasterLinkedStateControllerSingleton();

export default class LinkedState extends EventEmitter {
  _isOriginalInstance = false;

  constructor(linkedScopeName = DEFAULT_LINKED_SCOPE_NAME, initialDefaultState = {}) {
    super();

    this._uuid = uuidv4();

    this._rawCreateDate = new Date();
    this._rawInitCallStack = new Error();

    this._linkedScopeName = linkedScopeName;

    mlscs.addLinkedState(this, initialDefaultState);
  }

  getUUID() {
    return this._uuid;
  }

  getClassName() {
    const {constructor} = this;
    const {name: className} = constructor;

    return className;
  }

  /**
   * This method is only inteneded to be utilized by the
   * MasterLinkedStateControllerSingleton, and not directly set within this
   * class.
   * 
   * @param {*} isOriginalInstance 
   * @param {*} masterLinkedStateControllerSingleton 
   */
  setIsOriginalInstance(isOriginalInstance, masterLinkedStateControllerSingleton) {
    if (!(masterLinkedStateControllerSingleton instanceof MasterLinkedStateControllerSingleton)) {
      throw new Error('masterLinkedStateControllerSingleton is not an instance of MasterLinkedStateControllerSingleton');
    }

    this._isOriginalInstance = isOriginalInstance;
  }

  getIsOriginalInstance() {
    return this._isOriginalInstance;
  }

  getLinkedScopeName() {
    return this._linkedScopeName;
  }

  getCreateDate() {
    return this._rawCreateDate;
  }

  /**
   * Sets a common state across all shared linked state instances.
   * 
   * @param {*} updatedState 
   * @param {*} onSet
   */
  setState(updatedState = {}, onSet) {
    mlscs.setSharedState(this, {
      updatedState,
      meta: {
        rawDate: new Date(),
        rawCallStack: new Error()
      }
    });

    if (typeof onSet === 'function') {
      onSet();
    }
  }

  /**
   * Retrieves a common state across all shared link state instances.
   */
   getState() {
    // return sharedStates[this._linkedScopeName];
    return mlscs.getSharedState(this);
  }

  /**
   * Broadcasts an events across all shared linked state instances.
   * 
   * @param {*} updatedState 
   * @param {*} onSet 
   */
  broadcast(eventName, ...args) {
    mlscs.broadcast(this, eventName, ...args);
  }
}

export class MasterLinkedStateListener extends LinkedState {
  constructor() {
    // TODO: Use constant
    super('mlscs', {
      mlscs: null
    });
  }

  getLinkedStateInstances(linkedState = null) {
    return mlscs.getLinkedStateInstances(linkedState);
  }

  getLinkedStateInstanceWithUUID(uuid) {
    const linkedStateInstances = this.getLinkedStateInstances();

    const linkedState = linkedStateInstances.reduce((a, b) => {
      if (a && a.getUUID() == uuid) {
        return a;
      }

      if (b && b.getUUID() == uuid) {
        return b;
      }

      return undefined;
    });

    return linkedState;
  }
  
  getLinkedStateReferenceCount(linkedState) {
    return mlscs.getLinkedStateReferenceCount(linkedState);
  }
};

const masterLinkedStateListener = new MasterLinkedStateListener();

export {
  masterLinkedStateListener
};