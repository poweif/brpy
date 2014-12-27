# -*- coding: utf-8 -*-
#!/usr/bin/python

import logging
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError
from oauth2client.client import OAuth2Credentials
from apiclient.discovery import build
from apiclient.http import MediaIoBaseUpload

from os.path import join
import os
import io
import httplib2
import random
import string
import cherrypy
import pprint

import simplejson as json

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

PORT = 8124
HOME_URI = 'http://localhost:' + str(PORT)
POST_LOGIN_URI = HOME_URI + '/login'
SHOW_URI = HOME_URI + '/show'
SESSION_KEY = 'skulpt-gl-key'
SOLUTION_FILE_NAME = 'solution.json'
DEFAULT_PROJ_NAME = 'default'
PROJ_FILE_NAME = 'project.json'
MAIN_PY_NAME = 'main.py'
SKULPT_APP_DIR = 'skulptgl_app_data'
JSON_MIME = "application/json"
TEXT_MIME = "text/plain"
g_session = {}

# Find the first file (id) matching [title] in a folder.  Return None if not found.
def find_file(drive, folder_id, title):
    param = {"q": "title = '%s' and trashed = false" % title}
    items = drive.children().list(
        folderId=folder_id,
        **param).execute()['items']
    if len(items) < 1:
        return None
    return items[0]['id']

def create_folder(drive, parent_id, folder_name):
    res = drive.files().insert(
        body = {
            'title': folder_name,
            'parents': [{"id": parent_id}],
            'mimeType': "application/vnd.google-apps.folder"
        }).execute()
    return res['id']

def update_text_file(drive, parent_id, file_name, mime, text):
    file_id = find_file(drive, parent_id, file_name)
    if type(text) is str:
        text = unicode(text)
    output = io.StringIO(text)
    if file_id is None:
        file_id = drive.files().insert(
            media_body=MediaIoBaseUpload(output, mime),
            body={
                'title': file_name,
                'parents': [{"id": parent_id}],
                'mimeType': mime}).execute()
        output.close()
        return file_id['id']

    drive.files().update(
        uploadType="media",
        fileId=file_id,
        media_body=MediaIoBaseUpload(output, mime)).execute()
    output.close()

    return file_id

def read_text_file(drive, parent_id, file_id):
    tfile = drive.files().get(fileId=file_id).execute()
    download_url = tfile['downloadUrl']
    if download_url is None:
        return None

    resp, content = drive._http.request(download_url)
    if resp.status == 200:
        #print 'Status: %s' % resp
        return content
    else:
        print 'An error occurred: %s' % resp
        return None

def create_project(drive, app_folder_id, proj_name):
    proj_folder_id = create_folder(drive, app_folder_id, proj_name)
    proj_json = {
        'name': proj_name,
        'src' : [MAIN_PY_NAME],
        'default_file': 0}
    main_py = open('./simple/test.py')
    update_text_file(
        drive, proj_folder_id, MAIN_PY_NAME, TEXT_MIME, main_py.read())
    update_text_file(
        drive, proj_folder_id, PROJ_FILE_NAME, JSON_MIME, json.dumps(proj_json))
    main_py.close()

def create_default_solution(drive, app_folder_id):
    solution = {'project': DEFAULT_PROJ_NAME}
    return update_text_file(
        drive, app_folder_id, SOLUTION_FILE_NAME, JSON_MIME, json.dumps(solution))

def find_project(drive, app_folder_id, proj_name):
    proj_folder_id = find_file(drive, app_folder_id, proj_name)
    if proj_folder_id is None:
        return create_project(drive, app_folder_id, proj_name)
    return proj_folder_id

def find_solution(drive, app_folder_id):
    solution_file_id = find_file(drive, app_folder_id, SOLUTION_FILE_NAME)
    if solution_file_id is None:
        solution_file_id = create_default_solution(drive, app_folder_id)
    solution = json.loads(read_text_file(drive, app_folder_id, solution_file_id))
    return solution['project']

def find_app_folder(drive, root_id):
    app_folder_id = find_file(drive, root_id, SKULPT_APP_DIR)
    if app_folder_id is None:
        return create_folder(drive, root_id, SKULPT_APP_DIR)
    return app_folder_id

def load_project_data(drive, proj_folder_id):
    proj_file_id = find_file(drive, proj_folder_id, PROJ_FILE_NAME)
    if proj_file_id is None:
        return None
    proj = json.loads(read_text_file(drive, proj_folder_id, proj_file_id))
    content = {}
    return json.dumps(proj)

def skulptgl_solution(drive):
    root_id = drive.about().get().execute()['rootFolderId']
    app_folder_id = find_app_folder(drive, root_id)
    proj_name = find_solution(drive, app_folder_id)
    proj_folder_id = find_project(drive, app_folder_id, proj_name)
    return load_project_data(drive, proj_folder_id)

class GAuthServer(object):
    @cherrypy.expose    
    def ll(self):
        cookie = cherrypy.request.cookie
        if SESSION_KEY in cookie:
            session_key = cookie[SESSION_KEY].value
            if session_key in g_session:
                print "i'm here 3"
                drive = g_session[session_key]['drive']
                cherrypy.response.status = '200'
                cherrypy.response.headers['Content-Type'] = "text/plain"
                return skulptgl_solution(drive)
                
        cherrypy.response.cookie[SESSION_KEY] = ''
        cherrypy.response.status = '301'
        cherrypy.response.headers["Location"] = HOME_URI

    @cherrypy.expose
    def logout(self):
        cookie = cherrypy.request.cookie
        if SESSION_KEY in cookie:
            session_key = cookie[SESSION_KEY].value
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
        if SESSION_KEY in cookie:
            session_key = cookie[SESSION_KEY].value
            if session_key in g_session:
                cherrypy.response.status = '301'
                cherrypy.response.headers["Location"] = SHOW_URI
                return

        cherrypy.response.cookie[SESSION_KEY] = ''
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
