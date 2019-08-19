import EventEmitter from 'events';
import AppRuntime from './AppRuntime';
import AppRegistryLinkedState from 'state/AppRegistryLinkedState';
import { getAppControlCentral } from './ShellDesktop/AppControlCentral';
import { EVT_TICK, EVT_EXIT } from 'process/ClientProcess';
import './AppRegistration.typedefs.js';

const _appRegistryLinkedState = new AppRegistryLinkedState();

/**
 * Creates a registration which automatically populates app menus and the Dock
 * (if apps are launched, or they're pinned).
 * 
 * In order to populate the Dock, and any relevant app menus, this class should
 * be instantiated for each referenced app.
 * 
 * @extends EventEmitter
 */
class AppRegistration extends EventEmitter {
  /**
   * 
   * @param {AppRegistrationProps} appRegistrationProps 
   */
  constructor(appRegistrationProps) {
    super();

    const {
      title,
      iconSrc,
      mainView, // TODO: Rename to view
      cmd: runCmd,
      supportedMimes, // TODO: Rename to supportedMimeTypes
      menuItems,
      allowMultipleWindows,
    } = appRegistrationProps;

    this._appRegistrationProps = appRegistrationProps;

    this._isLaunched = false;

    // [8/12/2019] TODO: Map all appRegistrationProps as properties
    this._title = title;
    this._iconSrc = iconSrc;
    this._view = mainView; // TODO: Rename to view
    this._runCmd = runCmd;

    // TODO: Handle accordingly
    this._menuItems = menuItems || [];

    // Previous position and size
    // this._lastPosition = { x: 0, y: 0 };
    // this._lastSize = { width: 0, height: 0 };

    this._isUnregistered = false;
    this._supportedMimes = supportedMimes || [];

    this._allowMultipleWindows = allowMultipleWindows;

    // Add this app registration to the registry
    _appRegistryLinkedState.addAppRegistration(this);
  }

  /**
   * @return {AppRegistrationProps}
   */
  getProps() {
    return this._appRegistrationProps;
  }

  /**
   * Launches an AppRuntime based on this registration.
   * 
   * @param {any} cmdArguments? Optional cmd data to be sent to the
   * AppRuntime instance.
   * @return {Promise<AppRuntime> | boolean}
   */
  async launchApp(cmdArguments = null) {
    try {
      const appControlCentral = getAppControlCentral();

      const appRuntime = await appControlCentral.launchAppRegistration(this, cmdArguments);

      if (!(appRuntime instanceof AppRuntime)) {
        throw new Error('appRuntime is not an AppRuntime instance');
      }
      
      if (!appRuntime) {
        console.debug('AppControlCentral blocked launching of app registration', this);
        return;
      }

      appRuntime.on(EVT_TICK, () => {
        _appRegistryLinkedState.emitProcessTick();
      });

      // Important!  Wait until exit (not before exit)
      appRuntime.once(EVT_EXIT, () => {
        const appRuntimes = this.getJoinedAppRuntimes();

        if (!appRuntimes.length) {
          // All connected AppRuntime instances are closed
          this._setIsLaunched(false);
        }
      });

      this._setIsLaunched(true);

      return appRuntime;
    } catch (exc) {
      throw exc;
    }
  }

  async closeAllJoinedApps() {
    try {
      const appControlCentral = getAppControlCentral();
      return await appControlCentral.closeAllAppRuntimesByAppRegistration(this);
    } catch (exc) {
      throw exc;
    }
  }

  /**
   * Internally sets whether or not there are connected AppRuntime instances.
   * 
   * @param {boolean} isLaunched 
   */
  _setIsLaunched(isLaunched) {
    this._isLaunched = isLaunched;

    _appRegistryLinkedState.emitProcessTick();
  }

  /**
   * Retrieves whether or not there are connected AppRuntime instances.
   * 
   * @return {boolean}
   */
  getIsLaunched() {
    return this._isLaunched;
  }

  /**
   * @return {boolean} Whether multiple instances of this View (or Window) are
   * allowed.
   */
  getAllowMultipleWindows() {
    return this._allowMultipleWindows;
  }

  /**
   * Retrieves the launched app's process runtimes, if available.
   * 
   * @return {AppRuntime[]}
   */
  getJoinedAppRuntimes() {
    const appControlCentral = getAppControlCentral();

    return appControlCentral.getJoinedAppRuntimesByRegistration(this);
  }

  /**
   * TODO: Document
   * TODO: Rename to getSupportedMimeTypes
   */
  getSupportedMimes() {
    return this._supportedMimes;
  }

  /**
   * @return {string}
   */
  getTitle() {
    return this._title;
  }

  getIconSrc() {
    return this._iconSrc;
  }

  /**
   * @return {React.Component}
   */
  getView() {
    return this.view;
  }

  /**
   * Records the Window size in the given AppRuntime instance.
   * 
   * IMPORTANT! This should only be called by a Window component.
   * 
   * @param {AppRuntime} appRuntime 
   * @param {WindowSize} windowSize
   */
  recordAppRuntimeWindowSize(appRuntime, windowSize) {
    /*
    console.debug('TODO: Record app runtime window size', {
      appRuntime,
      windowSize
    });
    */
  }

  /**
   * Records the Window position in the given AppRuntime instance.
   * 
   * IMPORTANT! This should only be called by a Window component.
   * 
   * @param {AppRuntime} appRuntime 
   * @param {WindowPosition} windowPosition 
   */
  recordAppRuntimeWindowPosition(appRuntime, windowPosition) {
    /*
    console.debug('TODO: Record app runtime window position', {
      appRuntime,
      windowPosition
    });
    */
  }

  /**
   * Utilized to store metadata related to this AppRegistration. 
   * 
   * @return {string}
   */
  /*
  getSerializedRegistration() {
  }
  */

  /**
   * Removes this app (and all connected runtimes) from the Desktop registry.
   * 
   * Important!  Once the app is unregistered, it is no longer available in the
   * Dock or any app menus.
   */
  async unregister() {
    try {
      if (this.getIsLaunched()) {
        await this.closeAllJoinedApps();
      }

      // Remove from LinkedState
      _appRegistryLinkedState.removeAppRegistration(this);

      this._isUnregistered = true;
    } catch (exc) {
      throw exc;
    }
  }
}

export default AppRegistration;