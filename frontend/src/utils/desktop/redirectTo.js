import { desktopLinkedState } from './.common';

/**
 * Redirects to a URI path registered within the app.
 * 
 * Note!  This method does not directly redirect.  Look to
 * components/Desktop/URIRedirector for the redirect
 * implementation.
 * 
 * @param {string} redirectLocation [default = '/']
 */
const redirectTo = (redirectLocation = '/') => {
  desktopLinkedState.setState({
    redirectLocation
  });
};

export default redirectTo;