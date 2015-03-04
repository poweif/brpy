import logging
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
LOGIN = r'/login'
PUB = r'/pub'
USER = r'/user'
POST_LOGIN_URI = HOME_URI + '/login'
SHOW_URI = HOME_URI + '/show'
SESSION_KEY = 'skulpt-gl-key'
g_session = {}

INDEX_HTML = open(CURRENT_DIR + '/index.html').read()
DEV_PATH = None
g_solution = None


if len(sys.argv) >= 3 and os.access(sys.argv[1], os.F_OK):
    DEV_PATH = sys.argv[1]
    g_solution = DevSkSolution(DEV_PATH)
elif len(sys.argv) >= 2 and os.access(sys.argv[1], os.F_OK):
    DEV_PATH = sys.argv[1]
    g_solution = DevSkSolution(DEV_PATH, read_only=True)

#g_auth = EasyOAuth2(CLIENTSECRETS_LOCATION, SCOPES)

import tornado.ioloop
import tornado.web

ERR_PARAM = -3498314

class RunHandler(tornado.web.RequestHandler):
    def argshort(self, a, default=None):
        return self.get_argument(a, default=default)

    def get(self):
        if self.argshort('solution', default=ERR_PARAM) != ERR_PARAM:
            sol = json.dumps(g_solution.read_solution())
            if sol is not None:
                self.write(sol)
                return

        proj = self.argshort('read-proj')
        if proj is not None:
            self.write(json.dumps(g_solution.read_project(proj)))
            return

        fname = self.argshort('read')
        proj = self.argshort('proj')
        if fname is not None and proj is not None:
            self.write(g_solution.read_file(proj, fname))
            return

        self.send_error()

    def post(self):
        if self.argshort('update-solution', default=ERR_PARAM) != ERR_PARAM:
            body = json.loads(self.request.body)
            if g_solution.update_solution(body) is not None:
                return

        val = self.argshort('rename-proj')
        if val is not None:
            old_name, new_name = tuple(val.split(','))
            g_solution.rename_project(old_name=old_name, new_name=new_name)
            return

        proj = self.argshort('new-proj')
        if proj is not None and\
           g_solution.create_project(proj_name=proj) is not None:
            return

        proj = self.argshort('write-proj')
        if proj is not None:
            body = json.loads(self.request.body)
            if g_solution.update_project(proj, body):
                return

        proj = self.argshort('delete-proj')
        if proj is not None and g_solution.delete_project(proj):
            return

        val = self.argshort('rename')
        proj = self.argshort('proj')
        if val is not None and proj is not None:
            (old_name, new_name) = tuple(val.split(','))
            if g_solution.rename_file(proj, old_name, new_name):
                return

        fname = self.argshort('delete')
        if fname is not None and proj is not None and\
           g_solution.delete_file(proj, fname):
            return

        fname = self.argshort('write')
        if fname is not None and proj is not None:
            body = self.request.body
            if (g_solution.write_file(proj, fname, body)):
                return

        self.send_error()

if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/run", RunHandler),
        (r"/($)", tornado.web.StaticFileHandler, {'path': './index.html'}),
        (r"/(.*)", tornado.web.StaticFileHandler, {'path': './'})
    ])
    app.listen(PORT)
    tornado.ioloop.IOLoop.instance().start()
