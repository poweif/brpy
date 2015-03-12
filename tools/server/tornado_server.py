import logging
import httplib2
import os
import random
import string
import sys

import simplejson as json

from apiclient.discovery import build

from sk_solution import DevSkSolution, MongoDBSkSolution, GdriveSkSolution
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

g_session = {}
g_solution = None
g_motor_client = motor.MotorClient()


if len(sys.argv) >= 2 and os.access(sys.argv[1], os.F_OK):
    g_solution = DevSkSolution(sys.argv[1])
else:
    g_motor_client.drop_database('test')
    g_solution = MongoDBSkSolution(user='brpy_public', db=g_motor_client.test)

g_auth = EasyOAuth2(CLIENTSECRETS_LOCATION, SCOPES)

class LoginHandler(tornado.web.RequestHandler):
    def argshort(self, a, default=None):
        return self.get_argument(a, default=default)

    def get_current_user(self):
        return self.get_cookie(BRPY_SESSION_KEY)

    @gen.coroutine
    def get(self):
        if self.current_user is not None:
            self.redirect('/')
            return

        error_val = self.argshort('error')
        code_val = self.argshort('code')
        state_val = self.argshort('state')

        if error_val is not None or code_val is None or state_val is None:
            new_url = g_auth.get_authorization_url(POST_LOGIN_URI, get_random_state())
            return self.redirect(new_url)

        cred = g_auth.get_credentials(code_val, state=None, redirect_uri=POST_LOGIN_URI)
        user_info = get_user_info(cred)
        email = user_info.get('email')
        solution = MongoDBSkSolution(user=email, db=g_motor_client.test)
        user_key = state_val
        g_session[user_key] = {
            'info': user_info,
            'solution': solution
        }
        self.set_cookie(BRPY_SESSION_KEY, user_key)
        return self.redirect('/')

class LogoutHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        return self.get_cookie(BRPY_SESSION_KEY)

    @gen.coroutine
    def get(self):
        if self.current_user is not None:
            if self.current_user in g_session:
                g_session.pop(self.current_user, None)
        self.clear_cookie(BRPY_SESSION_KEY)
        return self.redirect('/')

class UserInfoHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        return self.get_cookie(BRPY_SESSION_KEY)

    def argshort(self, a, default=None):
        return self.get_argument(a, default=default)

    @gen.coroutine
    def get(self):
        user = self.current_user
        if not user in g_session:
            self.clear_cookie(BRPY_SESSION_KEY)
            self.finish()
            return

        if user is not None:
            self.write(json.dumps(g_session[user]['info']))
            self.finish()
            return
        self.send_error()

class RunHandler(tornado.web.RequestHandler):
    def argshort(self, a, default=None):
        return self.get_argument(a, default=default)

    def get_current_user(self):
        return self.get_cookie(BRPY_SESSION_KEY)

    def _get_solution(self):
        user = self.current_user
        if user is not None and not user in g_session:
            self.clear_cookie(BRPY_SESSION_KEY)
            return g_solution
        return g_solution if user is None else g_session[user]['solution']

    @gen.coroutine
    def get(self):
        solution = self._get_solution()
        if self.argshort('solution', default=ERR_PARAM) != ERR_PARAM:
            res = yield solution.read_solution()
            sol = json.dumps(res)
            if sol is not None:
                self.write(sol)
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

if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/login", LoginHandler),
        (r"/logout", LogoutHandler),
        (r"/run", RunHandler),
        (r"/user", UserInfoHandler),
        (r"/($)", tornado.web.StaticFileHandler, {'path': './index.html'}),
        (r"/(.*)", tornado.web.StaticFileHandler, {'path': './'})
    ], cookie_secret=get_random_state())
    app.listen(PORT)
    tornado.ioloop.IOLoop.instance().start()
