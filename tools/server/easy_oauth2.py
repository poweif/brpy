from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError
from oauth2client.client import OAuth2Credentials

class GetCredentialsException(Exception):
    """Exception while getting credentials"""
    def __init__(self, authorization_url):
        """Construct a GetCredentialsException."""
        super(GetCredentialsException, self).__init__()
        self.authorization_url = authorization_url

class CodeExchangeException(GetCredentialsException):
    """Exception while doing code exchange"""
    pass

class NoRefreshTokenException(GetCredentialsException):
    """Exception while refreshing token"""
    pass

class NoUserIdException(Exception):
    """Exception when user id invalid"""
    pass

class EasyOAuth2():
    def __init__(self, client_secret_loc, scopes):
        self._CLIENT_SECRET_LOC = client_secret_loc
        self._SCOPES = scopes

    def __exchange_code(self, authorization_code, redirect_uri):
        flow = flow_from_clientsecrets(
            self._CLIENT_SECRET_LOC, ' '.join(self._SCOPES),
            redirect_uri=redirect_uri)
        try:
            credentials = flow.step2_exchange(authorization_code)
            return credentials
        except FlowExchangeError, error:
            print 'An error occurred: %s' % (error)
            raise CodeExchangeException(None)

    def get_authorization_url(self, redirect, state):
        flow = flow_from_clientsecrets(
            self._CLIENT_SECRET_LOC,
            scope=' '.join(self._SCOPES),
            redirect_uri=redirect)
        flow.params['access_type'] = 'offline'
        flow.params['approval_prompt'] = 'auto'
        flow.params['state'] = state
        return flow.step1_get_authorize_url()

    def get_credentials(self, authorization_code, state, redirect_uri):
        email_address = ''
        try:
            credentials = self.__exchange_code(authorization_code, redirect_uri)
            user_info = get_user_info(credentials)
            email_address = user_info.get('email')
            return credentials
        except CodeExchangeException, error:
            logging.error('An error occurred during code exchange.')
            # Drive apps should try to retrieve the user and credentials for the current
            # session.
            # If none is available, redirect the user to the authorization URL.
            error.authorization_url = self.get_authorization_url(email_address, None)
            raise error
        except NoUserIdException:
            logging.error('No user ID could be retrieved.')
            # No refresh token has been retrieved.
            authorization_url = self.get_authorization_url(email_address, None)
        raise NoRefreshTokenException(authorization_url)
