# -*- coding: utf-8 -*-
#!/usr/bin/python

import logging
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError
from oauth2client.client import OAuth2Credentials
from apiclient.discovery import build

from os.path import join
import os
import httplib2
import random
import string
import cherrypy
import pprint

CURRENT_DIR = os.getcwd()
CLIENTSECRETS_LOCATION = './tools/gauth_files/client_secret.json'
FILES_DIR = './tools/gauth_files/'

SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive'
    # Add other requested scopes.
]

class GetCredentialsException(Exception):
    def __init__(self, authorization_url):
        """Construct a GetCredentialsException."""
        self.authorization_url = authorization_url

class CodeExchangeException(GetCredentialsException):
    pass

class NoRefreshTokenException(GetCredentialsException):
    pass

class NoUserIdException(Exception):
    pass

def get_stored_credentials(user_id):
    ofile = open(FILES_DIR + str(user_id) + '.cred', 'r')
    new_cred = OAuth2Credentials.from_json(ofile.read())
    ofile.close()
    return new_cred

def store_credentials(user_id, credentials):
    print CURRENT_DIR
    ofile = open(FILES_DIR + str(user_id) + '.cred', 'wb')
    ofile.write(credentials.to_json())
    ofile.close()

def exchange_code(authorization_code, redirect_uri):
    flow = flow_from_clientsecrets(
        CLIENTSECRETS_LOCATION, ' '.join(SCOPES),
        redirect_uri = redirect_uri)
    try:
        credentials = flow.step2_exchange(authorization_code)
        return credentials
    except FlowExchangeError, error:
        print 'An error occurred: %s' % (error)
        raise CodeExchangeException(None)

def get_user_info(credentials):
    user_info_service = build(
        serviceName = 'oauth2', version='v2',
        http = credentials.authorize(httplib2.Http()))
    user_info = None
    try:
        user_info = user_info_service.userinfo().get().execute()
    except errors.HttpError, e:
        logging.error('An error occurred: %s', e)
    if user_info and user_info.get('id'):
        return user_info
    else:
        raise NoUserIdException()

def build_drive_service(credentials):
    return build(
        serviceName = 'drive', version='v2',
        http = credentials.authorize(httplib2.Http()))

def get_authorization_url(redirect, state):
    flow = flow_from_clientsecrets(
        CLIENTSECRETS_LOCATION,
        scope = ' '.join(SCOPES),
        redirect_uri = redirect)
    flow.params['access_type'] = 'offline'
    flow.params['approval_prompt'] = 'auto'
    flow.params['state'] = state
    return flow.step1_get_authorize_url()

def get_credentials(authorization_code, state, redirect_uri):
    email_address = ''
    try:
        credentials = exchange_code(authorization_code, redirect_uri)
        user_info = get_user_info(credentials)
        email_address = user_info.get('email')
        user_id = user_info.get('id')
        if credentials.refresh_token is not None:
            store_credentials(user_id, credentials)
            return credentials
        else:
            credentials = get_stored_credentials(user_id)
            if credentials and credentials.refresh_token is not None:
                return credentials
    except CodeExchangeException, error:
        logging.error('An error occurred during code exchange.')
        # Drive apps should try to retrieve the user and credentials for the current
        # session.
        # If none is available, redirect the user to the authorization URL.
        error.authorization_url = get_authorization_url(email_address, None)
        raise error
    except NoUserIdException:
        logging.error('No user ID could be retrieved.')
    # No refresh token has been retrieved.
    authorization_url = get_authorization_url(email_address, None)
    raise NoRefreshTokenException(authorization_url)

def get_random_state():
    return ''.join(random.choice(string.ascii_uppercase + string.digits)
                   for x in xrange(32))
def process_name(name):
    return name

PORT = 8124
HOME_URI = 'http://localhost:' + str(PORT)
POST_LOGIN_URI = HOME_URI + '/login'
SHOW_URI = HOME_URI + '/show'
SESSION_KEY = 'skulpt-gl-key'
SKULPT_APP_DIR = 'skulptgl_app_data'
g_session = {}



def init_skulptgl_session(drive):
    param = {"q": "title = '%s' and trashed = false" %SKULPT_APP_DIR}
    about_res = drive.about().get().execute()
    root_folder_id = about_res['rootFolderId']
    app_dir_res = drive.children().list(
        folderId="root",
        **param).execute()
    if len(app_dir_res['items']) < 1:
        print('Did not find skulpt-gl app folder.  Create.')
        drive.files().insert(
            body = {
                'title': SKULPT_APP_DIR,
                'parents': [{"id": root_folder_id}],
                'mimeType': "application/vnd.google-apps.folder"
            }).execute()
        init_skulptgl_session(drive)
        return

    app_folder_id = app_dir_res['items'][0]['id']
    print '------------------------' + app_folder_id
    print app_dir_res['items'][0]

class GAuthServer(object):
    @cherrypy.expose
    def load(self):

        return

    @cherrypy.expose
    def logout(self):
        cookie = cherrypy.request.cookie
        if SESSION_KEY in cookie and type(cookie[SESSION_KEY]) is str:
            session_key = cookie[SESSION_KEY]
            del g_session[session_key]
        cherrypy.response.cookie[SESSION_KEY] = ''
        cherrypy.response.status = '301'
        cherrypy.response.headers["Location"] = HOME_URI

    @cherrypy.expose
    def login(self, **param):
        if 'error' in param or 'code' not in param or 'state' not in param:
            return 'LOGIN ERROR'
        session_key = param['state']
        cred = get_credentials(
            param['code'], state=None, redirect_uri=POST_LOGIN_URI)

        info = get_user_info(cred)
        drive_service = build_drive_service(cred)

        init_skulptgl_session(drive_service)

        g_session[session_key] = {
            'cred' : cred,
            'drive': drive_service
        }

        cherrypy.response.cookie[SESSION_KEY] = session_key
        cherrypy.response.status = '301'
        cherrypy.response.headers["Location"] = SHOW_URI

    @cherrypy.expose
    def index(self):
        cookie = cherrypy.request.cookie
        if SESSION_KEY in cookie and type(cookie[SESSION_KEY]) is str:
            cherrypy.response.status = '301'
            cherrypy.response.headers["Location"] = SHOW_URI
        else:
            new_url = get_authorization_url(POST_LOGIN_URI, get_random_state())
            cherrypy.response.status = '301'
            cherrypy.response.headers["Location"] = new_url

cherrypy.config.update({'server.socket_port': PORT,
                        'tools.encode.on': True,
                        'tools.encode.encoding': "utf-8"})

cherrypy.quickstart(
    GAuthServer(), '/',
    {'/':
     {'tools.staticdir.dir' : CURRENT_DIR,
      'tools.staticdir.on' : True},
     '/show':
     {'tools.staticfile.on' : True,
      'tools.staticfile.filename' : CURRENT_DIR + '/index.html'}
    }
)
