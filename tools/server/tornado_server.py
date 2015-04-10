import logging
import httplib2
import os
import random
import string
import sys

import simplejson as json

from apiclient.discovery import build

from sk_solution import DevSkSolution, MongoDBSkSolution, GdriveSkSolution,\
    HierarchicalSkSolution
from easy_oauth2 import EasyOAuth2

import tornado.ioloop
import tornado.web
from tornado import gen
import motor

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
USER = r'/user'
POST_LOGIN_URI = HOME_URI + '/login'
SHOW_URI = HOME_URI + '/show'
BRPY_SESSION_KEY = 'brpy-session-key'
ERR_PARAM = -3498314
INDEX_HTML = open(CURRENT_DIR + '/index.html').read()
STARTER_DIR = './starter'

g_session = {}
g_starter_solution = None
g_motor_client = motor.MotorClient()

_io_loop = tornado.ioloop.IOLoop.instance()

if len(sys.argv) >= 2 and os.access(sys.argv[1], os.F_OK):
    g_starter_solution = DevSkSolution(sys.argv[1])
else:
    g_motor_client.drop_database('test')
    read_only = True
    dev = DevSkSolution(STARTER_DIR, read_only=read_only)
    mongo = MongoDBSkSolution(
        user='brpy_public', db=g_motor_client.test, read_only=read_only)
    g_starter_solution = HierarchicalSkSolution(io_loop=_io_loop, l1=mongo, l2=dev)

g_auth = EasyOAuth2(CLIENTSECRETS_LOCATION, SCOPES)

SESSION_INFO = 'info'
SESSION_SOLUTION = 'solution'
SESSION_IMPORT = 'import'

class AllHandler(tornado.web.RequestHandler):
    def argshort(self, a, default=None):
        return self.get_argument(a, default=default)

    def get_current_user(self):
        return self.get_cookie(BRPY_SESSION_KEY)

    def _get_solution(self):
        user = self.current_user
        if user is not None and not user in g_session:
            self.clear_cookie(BRPY_SESSION_KEY)
            return g_starter_solution
        return g_starter_solution if user is None\
            else g_session[user][SESSION_SOLUTION]

class ExportHandler(AllHandler):
    @gen.coroutine
    def post(self):
        user_key = get_random_state()
        g_session[user_key] = {
            SESSION_IMPORT: self.request.body
        }
        self.write(user_key)
        return

class LoginHandler(AllHandler):
    @gen.coroutine
    def get(self):
        if self.current_user is not None:
            self.redirect('/')
            return

        error_val = self.argshort('error')
        code_val = self.argshort('code')
        state_val = self.argshort('state')
        tid = self.argshort('tid')
        if tid is None:
            tid = get_random_state()

        if error_val is not None or code_val is None or state_val is None:
            new_url = g_auth.get_authorization_url(POST_LOGIN_URI, tid)
            return self.redirect(new_url)


        cred = g_auth.get_credentials(
            code_val, state=None, redirect_uri=POST_LOGIN_URI)
        user_info = get_user_info(cred)
        email = user_info.get('email')
        mongo = MongoDBSkSolution(user=email, db=g_motor_client.test)
        gdrive = GdriveSkSolution(cred)
        solution = HierarchicalSkSolution(io_loop=_io_loop, l1=mongo, l2=gdrive)
        user_key = state_val

        if not user_key in g_session:
            g_session[user_key] = {}

        g_session[user_key][SESSION_INFO]= user_info
        g_session[user_key][SESSION_SOLUTION]= solution
        self.set_cookie(BRPY_SESSION_KEY, user_key)
        return self.redirect('/')

class LogoutHandler(AllHandler):
    @gen.coroutine
    def get(self):
        if self.current_user is not None:
            if self.current_user in g_session:
                g_session.pop(self.current_user, None)
        self.clear_cookie(BRPY_SESSION_KEY)
        return self.redirect('/')

class UserInfoHandler(AllHandler):
    @gen.coroutine
    def get(self):
        user = self.current_user
        if not user in g_session:
            self.clear_cookie(BRPY_SESSION_KEY)
            self.finish()
            return

        if user is not None:
            self.write(json.dumps(g_session[user][SESSION_INFO]))
            self.finish()
            return
        self.send_error()

INIT_LOAD_SOLUTION = 'INIT_LOAD_SOLUTION'
INIT_IMPORT_PROJECT = 'INIT_IMPORT_PROJECT'

class RunHandler(AllHandler):
    def _get_import_data(self):
        user = self.current_user
        if user is None or not user in g_session\
           or not SESSION_IMPORT in g_session[user]:
            return None
        return g_session[user][SESSION_IMPORT]

    def _clear_import_data(self):
        user = self.current_user
        if user is None or not user in g_session\
           or not SESSION_IMPORT in g_session[user]:
            return None
        del g_session[user][SESSION_IMPORT]

    @gen.coroutine
    def get(self):
        solution = self._get_solution()
        if self.argshort('init', default=ERR_PARAM) != ERR_PARAM:
            user = self.current_user
            if user is None or self._get_import_data() is None:
                self.write(INIT_LOAD_SOLUTION)
            else:
                self.write(INIT_IMPORT_PROJECT)
            self.finish()
            return

        if self.argshort('solution', default=ERR_PARAM) != ERR_PARAM:
            res = yield solution.read_solution()
            sol = json.dumps(res)
            if sol is not None:
                self.write(sol)
                self.finish()
                return

        if self.argshort('import-proj', default=ERR_PARAM) != ERR_PARAM:
            res = self._get_import_data()
            self.write(res)
            self._clear_import_data()
            self.finish()
            return

        proj = self.argshort('read-proj')
        if proj is not None:
            res = yield solution.read_project(proj)
            if (res is not None):
                self.write(json.dumps(res))
                self.finish()
                return

        fname = self.argshort('read')
        proj = self.argshort('proj')
        if fname is not None and proj is not None:
            res = yield solution.read_file(proj, fname)
            if res is not None:
                self.write(res)
                self.finish()
                return
        self.send_error()

    @gen.coroutine
    def post(self):
        solution = self._get_solution()
        if self.argshort('update-solution', default=ERR_PARAM) != ERR_PARAM:
            body = json.loads(self.request.body)
            if (yield solution.update_solution(body)) is not None:
                self.finish()
                return

        val = self.argshort('rename-proj')
        if val is not None:
            old_name, new_name = tuple(val.split(','))
            res = yield solution.rename_project(
                old_name=old_name, new_name=new_name)
            if res is not None:
                self.finish()
                return

        proj = self.argshort('new-proj')
        if proj is not None:
            res = yield solution.create_project(proj_name=proj)
            if res is not None:
                self.finish()
                return

        proj = self.argshort('write-proj')
        if proj is not None:
            body = json.loads(self.request.body)
            if (yield solution.update_project(proj, body)) is not None:
                self.finish()
                return

        proj = self.argshort('delete-proj')
        if proj is not None and\
           (yield solution.delete_project(proj)) is not None:
            self.finish()
            return

        val = self.argshort('rename')
        proj = self.argshort('proj')
        if val is not None and proj is not None:
            (old_name, new_name) = tuple(val.split(','))
            if (yield solution.rename_file(proj, old_name, new_name))\
               is not None:
                self.finish()
                return

        fname = self.argshort('delete')
        if fname is not None and proj is not None and\
           (yield solution.delete_file(proj, fname)) is not None:
            self.finish()
            return

        fname = self.argshort('write')
        if fname is not None and proj is not None:
            body = self.request.body
            if (yield solution.write_file(proj, fname, body)) is not None:
                self.finish()
                return

        self.send_error()
        self.finish()

class StarterRunHandler(RunHandler):
    def _get_solution(self):
        return g_starter_solution

class IndexHandler(AllHandler):
    @gen.coroutine
    def get(self):
        self.write(INDEX_HTML)

class RootIndexHandler(AllHandler):
    @gen.coroutine
    def get(self, v):
        if self.current_user is None:
            self.redirect('/starter/')
            return

        self.write(INDEX_HTML)

if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/export", ExportHandler),
        (r"/login", LoginHandler),
        (r"/logout", LogoutHandler),
        (r"/run", RunHandler),
        (r"/starter/run", StarterRunHandler),
        (r"/public/run", StarterRunHandler),
        (r"/user", UserInfoHandler),
        (r"/starter/", IndexHandler),
        (r"/public", IndexHandler),
        (r"/($)", RootIndexHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {'path': './'})
    ], cookie_secret=get_random_state())
    app.listen(PORT)
    _io_loop.start()
