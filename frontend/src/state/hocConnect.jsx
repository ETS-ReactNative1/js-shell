import React, {Component} from 'react';
import LinkedState, {EVT_LINKED_STATE_UPDATE} from './LinkedState';

/**
 * Connects LinkedState to a React component's lifecycle.
 * 
 * This function takes a component...
 * @see https://reactjs.org/docs/higher-order-components.html
 * 
 * @param {*} WrappedComponent 
 * @param {*} LinkedStateExtension
 * @param {Function} stateUpdateFilter [default = null] Applies this filtered
 * value to the component props when the state is updated.
 */
const hocConnect = (WrappedComponent, LinkedStateExtension, stateUpdateFilter = null) => {
  // ...and returns another component...
  return class extends Component {
    constructor(props) {
      super(props);

      if (LinkedStateExtension.prototype) {
        this._linkedStateInstance = new LinkedStateExtension();
      } else {
        this._linkedStateInstance = LinkedStateExtension;
      }

      if (!this._linkedStateInstance) {
        throw new Error('No LinkedStateExtension present');
      }
    }

    componentDidMount() {
      this._linkedStateInstance.on(EVT_LINKED_STATE_UPDATE, this.handleUpdatedState);

      const state = this._linkedStateInstance.getState();
      // Set the state, filtered if necessary
      this.handleUpdatedState(state);
    }

    componentWillUnmount() {
      this._linkedStateInstance.off(EVT_LINKED_STATE_UPDATE, this.handleUpdatedState);
      
      this._linkedStateInstance.destroy();
    }

    handleUpdatedState = (updatedState) => {
      if (typeof stateUpdateFilter === 'function') {
        // Overwrite updatedState w/ filter response
        updatedState = stateUpdateFilter(updatedState) || {};
      }

      this.setState(updatedState);
    }

    render() {
      const passedProps = Object.assign({}, this.props, this.state);

      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      return <WrappedComponent
        // data={this.state.data}
        {...passedProps}
        // ref={ c => this._wrappedComponent = c }
      />;
    }
  };
};

export default hocConnect;