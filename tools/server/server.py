import logging
import cherrypy
import httplib2
import os
import random
import string
import sys

import simplejson as json

from apiclient.discovery import build

from sk_solution import GdriveSkSolution, DevSkSolution
from easy_oauth2 import EasyOAuth2

def get_user_info(credentials):
    user_info_service = build(
        serviceName='oauth2', version='v2',
        http=credentials.authorize(httplib2.Http()))
    user_info = None
    try:
        user_info = user_info_service.userinfo().get().execute()
    except Error, er:
        logging.error('An error occurred: %s', er)
    if user_info and user_info.get('id'):
        return user_info
    else:
        raise NoUserIdException()

def get_random_state():
    return ''.join(random.choice(string.ascii_uppercase + string.digits)
                   for x in xrange(32))

CURRENT_DIR = os.getcwd()
CLIENTSECRETS_LOCATION = './tools/files/client_secret.json'
SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive'
    # Add other requested scopes.
]
PORT = 8124
HOME_URI = 'http://localhost:' + str(PORT)
POST_LOGIN_URI = HOME_URI + '/login'
SHOW_URI = HOME_URI + '/show'
SESSION_KEY = 'skulpt-gl-key'
g_session = {}

INDEX_HTML = open(CURRENT_DIR + '/index.html').read()
DEV_PATH = None
if len(sys.argv) >= 2 and os.access(sys.argv[1], os.F_OK):
    DEV_PATH = sys.argv[1]

g_auth = EasyOAuth2(CLIENTSECRETS_LOCATION, SCOPES)

def create_solution(cred):
    if DEV_PATH:
        return DevSkSolution(DEV_PATH)
    return GdriveSkSolution(cred)

class CherrypyServer(object):
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

        if 'solution' in param:
            solution = solution.read_solution()
            if solution is not None:
                return self.__result(content=json.dumps(solution))
            return self.__result()

        # switch project
        if 'proj' in param:
            proj = param['proj']
            if proj is None:
                return self.__result()
            return self.__result(content=solution.read_project(proj))

        if 'rename-proj' in param:
            new_name = param['rename-proj']
            if new_name is not None and\
               solution.rename_project(new_name=new_name):
                return self.__result(content='finished renaming project')
            return self.__result()

        if 'new-proj' in param:
            name = param['new-proj']
            if name is not None:
                res = solution.create_project(proj_name=name)
                if res is not None:
                    return self.__result(content=solution.read_project(name))
            return self.__result()

        if 'write-proj' in param:
            nproj = json.loads(cherrypy.request.body.read())
            if solution.update_project(nproj):
                return self.__result(content='finished updating project')
            return self.__result()

        if 'read' in param:
            res = solution.read_file(param['read'])
            if res is not None:
                return self.__result(content=res)
            return self.__result()

        if 'rename' in param:
            fs = param['rename'].split(',')
            if solution.rename_file(old_name=fs[0], new_name=fs[1]):
                return self.__result(
                    content="finished renaming " + fs[0] + " to " + fs[1])
            return self.__result()

        if 'delete' in param:
            fname = param['delete']
            if solution.delete_file(fname):
                return self.__result(content="finished deleting " + fname)
            return self.__result()

        if 'write' in param:
            fname = param['write']
            if solution.write_file(fname, cherrypy.request.body.read()):
                return self.__result(content='finished writing ' + fname)
            return self.__result()

        return self.__result()

    @cherrypy.expose
    def login(self, **param):
        if 'error' in param or 'code' not in param or 'state' not in param:
            return 'LOGIN ERROR'
        cred = g_auth.get_credentials(
            param['code'], state=None, redirect_uri=POST_LOGIN_URI)

        user_info = get_user_info(cred)
        email_address = user_info.get('email')

        login_id = get_random_state()
        cherrypy.session[SESSION_KEY] = login_id
        g_session[login_id] = {
            'email': email_address,
            'solution': create_solution(cred)
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

        new_url = g_auth.get_authorization_url(POST_LOGIN_URI, get_random_state())
        return self.__result(redirect=new_url)

def serve_cherrypy():
    cherrypy.config.update({'server.socket_port': PORT,
                            'tools.encode.on': True,
                            'tools.encode.encoding': "utf-8"})
    cherrypy.quickstart(CherrypyServer(), '/', {
            '/': {
                'tools.staticdir.dir' : CURRENT_DIR,
                'tools.staticdir.on' : True
                }
            }
        )

if __name__ == "__main__":
    serve_cherrypy()
