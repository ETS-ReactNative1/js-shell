import EventEmitter from 'events';
import AppRuntime from 'core/AppRuntime';
import AppRuntimeLinkedState from 'state/AppRuntimeLinkedState';
import Window, { EVT_BEFORE_CLOSE } from './Window';

const _appRuntimeLinkedState = new AppRuntimeLinkedState();

/**
 * @extends EventEmitter
 */
class WindowStack extends EventEmitter {
  constructor() {
    super();

    /**
     * An array of Window components.
     * 
     * Note that the order of indexes reflects how they will be positioned.
     * 
     * @type {Window[]}
     */
    this._stack = [];
  }

  /**
   * @return {Window[]}
   */
  getWindowStack() {
    return this._stack;
  }

  getWindowStackIndex(desktopWindow) {
    const currIdx = this._stack.indexOf(desktopWindow);
    if (currIdx === -1) {
      console.warn('desktopWindow is not in the stack');
      return;
    }

    return currIdx;
  }

  focusWindow(desktopWindow) {
    if (!(desktopWindow instanceof Window)) {
      throw new Error('desktopWindow is not a Window instance');
    }

    const lenStack = this._stack.length;

    // Move window to the top of stack
    const currIdx = this.getWindowStackIndex(desktopWindow);
    
    // Remove from stack
    this._stack.splice(currIdx, 1);

    // Push to the end of the stack
    this._stack.push(desktopWindow);
    
    for (let i = 0; i < lenStack; i++) {
      const testWindow = this._stack[i];
    
      // Apply relevant z-indexes (to visually render them)
      testWindow.setZIndex(i * 1000);
    
      // Blur other windows
      if (!Object.is(desktopWindow, testWindow)) {
        testWindow.blur();
      }
    }
  }

  focusAppRuntime(appRuntime) {
    if (!(appRuntime instanceof AppRuntime)) {
      throw new Error('appRuntime is not an AppRuntime instance');
    }

    // Locate all windows for the desktopWindow AppRuntime

    // Push them all to the top of the stack, in the current order

    // Render the stack accordingly
  }

  /**
   * IMPORTANT! This should be set internally by a Window component's lifecycle,
   * and not anywhere else.
   * 
   * @param {Window} desktopWindow 
   */
  _addWindow(desktopWindow) {
    if (!(desktopWindow instanceof Window)) {
      throw new Error('desktopWindow is not a Window instance');
    }

    // Handle window close cleanup
    desktopWindow.on(EVT_BEFORE_CLOSE, () => {
      this._removeWindow(desktopWindow);
    });

    this._stack.push(desktopWindow);
  }

  /**
   * IMPORTANT! This should be set internally by a Window component's lifecycle,
   * and not anywhere else.
   * 
   * @param {Window} desktopWindow 
   */
  _removeWindow(desktopWindow) {
    if (!(desktopWindow instanceof Window)) {
      throw new Error('desktopWindow is not a Window instance');
    }

    this._stack = this._stack.filter(testWindow => {
      return testWindow !== desktopWindow
    });
  }
};

export default WindowStack;