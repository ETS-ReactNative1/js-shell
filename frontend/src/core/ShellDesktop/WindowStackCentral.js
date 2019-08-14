// TODO: Prevent Windows from being positioned outside of viewable area
// (or snap back after positioning)

import ClientProcess, { /* EVT_BEFORE_EXIT */ } from 'process/ClientProcess';
import AppRegistration from '../AppRegistration';
import AppRuntime from '../AppRuntime';
import Window, { EVT_MOUNT, EVT_BEFORE_CLOSE } from 'components/Desktop/Window';

let _windowStackCentral = null;

/**
 * Window Stack Central manages the entire Window stack.
 * 
 * @extends ClientProcess
 */
class WindowStackCentral extends ClientProcess {
  // Default offset of where to place the next Window, relevant to the previous
  // Window
  static nextDefaultPositionOffset = {
    x: 20,
    y: 20
  };

  constructor(...args) {
    if (_windowStackCentral) {
      throw new Error('Another WindowStackCentral already exists!');
    }

    super(...args);

    this.setTitle('Window Stack Central');

    /**
     * An array of Window components.
     * 
     * Note that the order of indexes reflects how they will be positioned.
     * 
     * @type {Window[]}
     */
    this._stack = [];

    // Register process flag
    _windowStackCentral = this;

    /**
     * If no position information is stored for the Window, this value will be
     * used for the Window position.  It is updated internally per each Window.
     * 
     * @type {WindowPosition}
     */
    this._nextDefaultPosition = {
      x: 0,
      y: 0
    };
  }

  incrementNextDefaultPosition() {
    let { x, y } = this._nextDefaultPosition;
    const { x: offsetX, y: offsetY } = WindowStackCentral.nextDefaultPositionOffset;

    // Apply offsets
    x += offsetX;
    y += offsetY;

    this._nextDefaultPosition = {
      x,
      y
    };
  }

  /**
   * @return {Window[]}
   */
  getWindowStack() {
    return this._stack;
  }

  /**
   * 
   * @param {number} desktopWindow 
   */
  getWindowStackIndex(desktopWindow) {
    for (let i = 0; i < this._stack.length; i++) {
      const testWindow = this._stack[i];

      if (Object.is(testWindow, desktopWindow)) {
        return i;
      }
    }

    console.warn('desktopWindow is not in the stack');
  }

  /**
   * Focuses a single window.
   * 
   * @param {Window} desktopWindow 
   */
  focusWindow(desktopWindow) {
    if (!(desktopWindow instanceof Window)) {
      throw new Error('desktopWindow is not a Window instance');
    }

    // Move window to the top of stack
    const currIdx = this.getWindowStackIndex(desktopWindow);
    
    // Temporarily Remove from stack
    this._stack.splice(currIdx, 1);

    // Push to the end of the stack
    this._stack.push(desktopWindow);

    // Set focused app runtime in LinkedState
    const appRuntime = desktopWindow.getAppRuntimeIfExists();
    if (appRuntime) {
      appRuntime.focus();
    }
    
    this.renderStack();
  }

  bringSubWindowStackToTop(desktopWindows) {
    // Push them all to the top of the stack, in the current order
    const lenDesktopWindows = desktopWindows.length;
    for (let i = 0; i < lenDesktopWindows; i++) {
      const currWindow = desktopWindows[i];

      const currIdx = this.getWindowStackIndex(currWindow);

      if (currIdx === -1) {
        continue;
      }
      
      // Temporarily remove from stack
      this._stack.splice(currIdx, 1);
      
      // Push to the end of the stack
      this._stack.push(currWindow);
    }

    this.renderStack();
  }

  bringAppRegistrationWindowsToFront(appRegistration) {
    if (!(appRegistration instanceof AppRegistration)) {
      throw new Error('appRegistration is not an AppRegistration instance');
    }

    // Locate all windows for the desktopWindow AppRuntime
    const appRegistrationWindows = this.getJoinedAppRegistrationWindows(appRegistration);

    this.bringSubWindowStackToTop(appRegistrationWindows);
  }

  /**
   * Brings all connected windows to the given AppRuntime to the top of the
   * stack, then renders them.
   * 
   * @param {AppRuntime} appRuntime 
   */
  bringAppRuntimeWindowsToFront(appRuntime) {
    if (!(appRuntime instanceof AppRuntime)) {
      throw new Error('appRuntime is not an AppRuntime instance');
    }

    // Locate all windows for the desktopWindow AppRuntime
    const appRuntimeWindows = this.getJoinedAppRuntimeWindows(appRuntime);

    this.bringSubWindowStackToTop(appRuntimeWindows);
  }

  /**
   * Retrieves Window components connected to the given AppRuntime.
   * 
   * @param {AppRuntime} appRuntime
   * @return {Window[]}
   */
  getJoinedAppRuntimeWindows(appRuntime) {
    if (!(appRuntime instanceof AppRuntime)) {
      throw new Error('appRuntime is not an AppRuntime instance');
    }

    const appRegistration = appRuntime.getAppRegistration();

    return this.getJoinedAppRegistrationWindows(appRegistration);
  }

  /**
   * Retrieves Window components connected to the given AppRegistration.
   * 
   * @param {AppRegistration} appRegistration
   * @return {Window[]}
   */
  getJoinedAppRegistrationWindows(appRegistration) {
    /**
     * @type {AppRuntime[]}
     */
    const joinedAppRuntimes = appRegistration.getJoinedAppRuntimes();
    const lenJoinedAppRuntimes = joinedAppRuntimes.length;

    const joinedAppRuntimeWindows = [];
    
    for (let i = 0; i < lenJoinedAppRuntimes; i++) {
      const currAppRuntime = joinedAppRuntimes[i];
      const currWindow = currAppRuntime.getWindowIfExists();

      if (currWindow) {
        joinedAppRuntimeWindows.push(currWindow);
      }
    }

    return joinedAppRuntimeWindows;
  }

  /**
   * Applies zIndexes on the underlying Window stack, and applies focus() /
   * blur() to each Window, depending on where they are in the stack.
   * 
   * The Window with the highest stack index (0 is lowest), will become the
   * focused Window, while all others are blurred.
   */
  renderStack() {
    console.warn('rendering stack', this._stack);

    const lenStack = this._stack.length;

    for (let i = 0; i < lenStack; i++) {
      const testWindow = this._stack[i];

      if (!testWindow) {
        console.error('Skipping non-Window @', {
          i,
          stack: this._stack
        });
        continue;
      }
    
      // Apply relevant z-indexes (to visually render them)
      testWindow.setZIndex(i);
      
      if (i < lenStack - 1) {
        // Blur other windows
        testWindow.blur();
      } else {
        // Focus highest zIndex window
        testWindow.focus();
      }
    }
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

    this._stack.push(desktopWindow);

    // Apply Window position once mounted
    desktopWindow.once(EVT_MOUNT, () => {
      desktopWindow.setPosition(this._nextDefaultPosition);
      this.incrementNextDefaultPosition();
    });

    // Handle window close cleanup
    desktopWindow.on(EVT_BEFORE_CLOSE, () => {
      this._removeWindow(desktopWindow);
    });
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
      return !Object.is(testWindow, desktopWindow);
    });
  }
}

//

/**
 * @return {AppLaunchController} A constructed instance of the
 * AppLaunchController
 */
const getWindowStackCentral = () => {
  if (!_windowStackCentral) {
    throw new Error('No Window Stack Central defined');
  }

  return _windowStackCentral;
};

export default WindowStackCentral;
export {
  getWindowStackCentral
};