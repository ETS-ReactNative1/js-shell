import EventEmitter from 'events';
import AppRuntime from './AppRuntime';
import AppRegistryLinkedState from 'state/AppRegistryLinkedState';
import { EVT_EXIT } from 'process/ClientProcess';
import './AppRuntime.typedef';

const commonAppRegistryLinkedState = new AppRegistryLinkedState();

/**
 * Creates a registration which automatically populates app menus and the Dock
 * (if apps are launched, or they're pinned).
 * 
 * TODO: Move this comment to the Dock; The items in the Dock represent a
 * filtered subset of all available registrations.
 * 
 * In order to populate the Dock, and any relevant app menus, this class should
 * be instantiated for each referenced app.
 * 
 * @extends EventEmitter
 */
class AppRegistration extends EventEmitter {
  /**
   * 
   * @param {AppRuntimeRunProps} runProps 
   */
  constructor(runProps) {
    super();

    const {
        title,
        iconSrc,
        mainView,
        cmd: appCmd,
    } = runProps;

    this._isLaunched = false;
    this._appRuntime = null;

    this._title = title;
    this._iconSrc = iconSrc;
    this._mainView = mainView;
    this._appCmd = appCmd;

    this._isUnregistered = false;

    // Add this app registration to the registry
    commonAppRegistryLinkedState.addAppRegistration(this);
  }

  async launchApp() {
    try {
      if (this._appRuntime) {
        // Gracefully fail
        console.warn('App is already launched, or is launching');
        return;
      }

      this._appRuntime = new AppRuntime({
        title: this._title,
        iconSrc: this._iconSrc,
        mainView: this._mainView,
        appCmd: this._appCmd
      });
  
      // Handle cleanup when the app exits
      this._appRuntime.on(EVT_EXIT, () => {
        this._isLaunched = false;
        this._appRuntime = null;

        // Emit to listeners that the app is closed
        commonAppRegistryLinkedState.emitRegistrationsUpdate();
      });

      await this._appRuntime.onceReady();
  
      this._isLaunched = true;

      // Emit to listeners that the app is launched
      commonAppRegistryLinkedState.emitRegistrationsUpdate();
    } catch (exc) {
      throw exc;
    }
  }

  getIsLaunched() {
    return this._isLaunched;
  }
  
  /**
   * Retrieves the launched app's process runtime, if available.
   * 
   * @return {AppRuntime}
   */
  getAppRuntime() {
    return this._appRuntime;
  }

  async closeApp() {
    try {
      if (!this._appRuntime) {
        // Gracefully fail
        console.warn('appRuntime is not registered');
        return;
      }

      await this._appRuntime.close();
    } catch (exc) {
      throw exc;
    }
  }

  getTitle() {
    return this._title;
  }

  focus() {
    this._appRuntime.focus();
  }

  getIconSrc() {
    return this._iconSrc;
  }

  getMainWindow() {
    return this._mainView;
  }

  /**
   * Removes this app from the Desktop registry.
   * 
   * Important!  Once the app is unregistered, it is no longer available in the
   * Dock or any app menus.
   */
  async unregister() {
    try {
      if (this.getIsLaunched()) {
        const appRuntime = this.getAppRuntime();
  
        await appRuntime.kill();
      }
  
      commonAppRegistryLinkedState.removeAppRegistration(this);
  
      this._isUnregistered = true;
    } catch (exc) {
      throw exc;
    }
  }
}

export default AppRegistration;