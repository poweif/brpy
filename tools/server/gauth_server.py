# -*- coding: utf-8 -*-
#!/usr/bin/python

import logging
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError
from oauth2client.client import OAuth2Credentials
from apiclient.discovery import build

from os.path import join
import os

import random
import string
import cherrypy
import pprint
import httplib2

import simplejson as json

from gdrive_sk_solution import GdriveSkSolution

CURRENT_DIR = os.getcwd()
FILES_DIR = './tools/files/'
CLIENTSECRETS_LOCATION = FILES_DIR + 'client_secret.json'

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
#    ofile = open(FILES_DIR + str(user_id) + '.cred', 'wb')
#    ofile.write(credentials.to_json())
#    ofile.close()
    return

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
#        if credentials.refresh_token is not None:
#            store_credentials(user_id, credentials)
        return credentials
#        else:
#            credentials = get_stored_credentials(user_id)
#            if credentials and credentials.refresh_token is not None:
#                return credentials
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

PORT = 8124
HOME_URI = 'http://localhost:' + str(PORT)
POST_LOGIN_URI = HOME_URI + '/login'
SHOW_URI = HOME_URI + '/show'
SESSION_KEY = 'skulpt-gl-key'
g_session = {}

INDEX_HTML = open(CURRENT_DIR + '/index.html').read()

class GAuthServer(object):
    _cp_config = {
        'tools.sessions.on' : True
    }

    def __result(self, redirect=None, content=None, session_key=None):
        if redirect is not None:
            if session_key is not None:
                cherrypy.response.cookie[SESSION_KEY] = session_key

            cherrypy.response.status = '301'
            cherrypy.response.headers["Location"] = redirect
            return

        if content is not None:
            cherrypy.response.status = '200'
            cherrypy.response.headers['Content-Type'] = "text/plain"
            return content

        cherrypy.response.status = '404'
        return

    @cherrypy.expose
    def run(self, **param):
        if not SESSION_KEY in cherrypy.session:
            return self.__result()

        login_id = cherrypy.session[SESSION_KEY]
        if not login_id in g_session:
            return self.__result()

        session = g_session[login_id]
        if not 'solution' in session:
            return self.__result()

        solution = session['solution']

        if 'proj' in param:
            return self.__result(content=solution.project_metadata())

        if 'wproj' in param:
            nproj = json.loads(cherrypy.request.body.read())
            res = solution.update_project(nproj)
            if res is not None:
                return self.__result(content='finished updating project')
            return self.__result()

        if 'read' in param:
            res = solution.read_file(param['read'])
            if res is not None:
                return self.__result(content=res)
            return self.__result()

        if 'rename' in param:
            files = param['rename'].split(',')
            res = solution.rename_file(old_name=files[0], new_name=files[1])
            if res is not None:
                return self.__result(
                    content="finished renaming " + files[0] + " to " + files[1])
            return self.__result()

        if 'delete' in param:
            fname = param['delete']
            res = solution.delete_file(fname)
            if res is not None:
                return self.__result(content="finished deleting " + fname)
            return self.__result()

        if 'write' in param:
            fname = param['write']
            res = solution.write_file(
                fname,
                cherrypy.request.body.read())
            if res is not None:
                return self.__result(content='finished writing ' + fname)
            return self.__result()

        return self.__result()

    @cherrypy.expose
    def login(self, **param):
        if 'error' in param or 'code' not in param or 'state' not in param:
            return 'LOGIN ERROR'
        session_key = param['state']
        cred = get_credentials(
            param['code'], state=None, redirect_uri=POST_LOGIN_URI)

        user_info = get_user_info(cred)
        email_address = user_info.get('email')

        login_id = get_random_state()
        cherrypy.session[SESSION_KEY] = login_id
        g_session[login_id] = {
            'email': email_address,
            'solution': SkulptglSolution(cred)
        }
        cherrypy.request.login = email_address

        return self.__result(redirect=SHOW_URI)

    @cherrypy.expose
    def logout(self):
        if SESSION_KEY in cherrypy.session:
            login_id = cherrypy.session[SESSION_KEY]
            del g_session[login_id]
            cherrypy.session[SESSION_KEY] = None

        return self.__result(redirect=HOME_URI)

    @cherrypy.expose
    def show(self, **param):
        if SESSION_KEY in cherrypy.session:
            return INDEX_HTML
        return self.__result(redirect=HOME_URI)

    @cherrypy.expose
    def index(self):
        if SESSION_KEY in cherrypy.session:
            return self.__result(redirect=SHOW_URI)

        new_url = get_authorization_url(POST_LOGIN_URI, get_random_state())
        return self.__result(redirect=new_url)

cherrypy.config.update({'server.socket_port': PORT,
                        'tools.encode.on': True,
                        'tools.encode.encoding': "utf-8"})

cherrypy.quickstart(
    GAuthServer(), '/',
    {'/':
     {'tools.staticdir.dir' : CURRENT_DIR,
      'tools.staticdir.on' : True}
    }
)
