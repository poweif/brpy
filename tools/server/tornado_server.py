import logging
import httplib2
import os
import random
import string
import sys
import time

import simplejson as json

from apiclient.discovery import build
from oauth2client.client import GoogleCredentials

import tornado.ioloop
import tornado.web
from tornado import gen
import motor

from sk_solution import DevSkSolution, MongoDBSkSolution, GdriveSkSolution,\
    HierarchicalSkSolution
from easy_oauth2 import EasyOAuth2
from publisher import ProjectPublisher
from googleapiclient.discovery import build

def get_user_info(cred=None, true_cred=None):
    if true_cred is None:
        user_info_service = build(
            serviceName='oauth2', version='v2',
            http=cred.authorize(httplib2.Http()))
    else:
        user_info_service = build(
            serviceName='oauth2', version='v2',
            credentials=true_cred)
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
                   for x in xrange(19))

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
START_DIR = './start'
PUBLISHED_DIR = './published'
BRPY_PUBLISH_PROJECT_KEY = 'brpy-publish-project-key'

_session = {}
_motor_client = motor.MotorClient()
_motor_client.drop_database('test')
_io_loop = tornado.ioloop.IOLoop.instance()

def build_start_solution(read_only=True):
    dev = DevSkSolution(START_DIR, read_only=read_only)
    mongo = MongoDBSkSolution(
        user='brpy_public', db=_motor_client.test, read_only=read_only)
    return HierarchicalSkSolution(io_loop=_io_loop, l1=mongo, l2=dev)

def clear_published(drive, app_dir):
    root = drive.about().get().execute()['rootFolderId']
    param = {"q": "title = '%s' and trashed = false" % app_dir}
    items = drive.children().list(folderId=root, **param).execute()['items']
    if len(items) > 0:
        iid = items[0]['id']
        drive.files().trash(fileId=iid).execute()
    gdrive = GdriveSkSolution(drive=drive, app_dir=app_dir, read_only=False)
    print _io_loop.run_sync(gdrive.read_solution)

    @gen.coroutine
    def delete_default_proj():
        raise gen.Return((yield gdrive.delete_project('example')))

#    _io_loop.run_sync(delete_default_proj)


def build_published_solution(read_only=True):
    app_dir = "brpy_published_data"
    cred = GoogleCredentials.get_application_default()

    drive = build('drive', 'v2', credentials=cred)
    if not read_only:
        clear_published(drive=drive, app_dir=app_dir)
        pass

    gdrive = GdriveSkSolution(drive=drive, app_dir=app_dir, read_only=read_only)
    mongo = MongoDBSkSolution(
        user='brpy_public', db=_motor_client.test, read_only=read_only,
        app_dir=app_dir)
    return HierarchicalSkSolution(io_loop=_io_loop, l1=mongo, l2=gdrive)

_start_solution = build_start_solution()
_published_solution = build_published_solution()
_publishing_solution = build_published_solution(read_only=False)
_publisher = ProjectPublisher(db=_motor_client.test)
_auth = EasyOAuth2(CLIENTSECRETS_LOCATION, SCOPES)

print 'server ready to go'

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
        if user is not None and not user in _session:
            self.clear_cookie(BRPY_SESSION_KEY)
            return _start_solution
        return _start_solution if user is None\
            else _session[user][SESSION_SOLUTION]

class ExportHandler(AllHandler):
    @gen.coroutine
    def post(self):
        if self.current_user is not None:
            user_key = self.current_user
        else:
            user_key = get_random_state()

        if not user_key in _session:
            _session[user_key] = {}
        _session[user_key][SESSION_IMPORT] = self.request.body
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
            new_url = _auth.get_authorization_url(POST_LOGIN_URI, state=tid)
            return self.redirect(new_url)

        cred = _auth.get_credentials(
            code_val, state=None, redirect_uri=POST_LOGIN_URI)
        user_info = get_user_info(cred)
        email = user_info.get('email')
        mongo = MongoDBSkSolution(user=email, db=_motor_client.test)
        gdrive = GdriveSkSolution(cred=cred)
        solution = HierarchicalSkSolution(io_loop=_io_loop, l1=mongo, l2=gdrive)
        user_key = state_val
        self.set_cookie(BRPY_SESSION_KEY, user_key)

        if not user_key in _session:
            _session[user_key] = {}

        _session[user_key][SESSION_INFO]= user_info
        _session[user_key][SESSION_SOLUTION]= solution
        return self.redirect('/')

class LogoutHandler(AllHandler):
    @gen.coroutine
    def get(self):
        if self.current_user is not None:
            if self.current_user in _session:
                _session.pop(self.current_user, None)
        self.clear_cookie(BRPY_SESSION_KEY)
        return self.redirect('/')

class UserInfoHandler(AllHandler):
    @gen.coroutine
    def get(self):
        user = self.current_user
        if not user in _session:
            self.clear_cookie(BRPY_SESSION_KEY)
            self.finish()
            return

        if user is not None:
            self.write(json.dumps(_session[user][SESSION_INFO]))
            self.finish()
            return
        self.send_error()

INIT_LOAD_SOLUTION = 'INIT_LOAD_SOLUTION'
INIT_IMPORT_PROJECT = 'INIT_IMPORT_PROJECT'

class RunHandler(AllHandler):
    def _get_import_data(self):
        user = self.current_user
        if user is None or not user in _session\
           or not SESSION_IMPORT in _session[user]:
            return None
        return _session[user][SESSION_IMPORT]

    def _clear_import_data(self):
        user = self.current_user
        if user is None or not user in _session\
           or not SESSION_IMPORT in _session[user]:
            return None
        del _session[user][SESSION_IMPORT]

    def _publishable(self):
        return self.current_user is not None

    @gen.coroutine
    def get(self):
        solution = self._get_solution()
        if solution is None:
            self.send_error()
            return

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
            self.write(self._get_import_data())
            self._clear_import_data()
            self.finish()
            return

        if self.argshort('publish', default=ERR_PARAM) != ERR_PARAM:
            if not self._publishable():
                self.clear_cookie(BRPY_PUBLISH_PROJECT_KEY)
                self.send_error()
                return
            key = yield _publisher.begin(self.current_user)
            self.set_cookie(BRPY_PUBLISH_PROJECT_KEY, key)
            self.write(key)
            self.finish()
            return

        pub_key = self.argshort('done-publish')
        if pub_key is not None and self._publishable():
            yield _publisher.end(user=self.current_user, key=pub_key)
            self.clear_cookie(BRPY_PUBLISH_PROJECT_KEY)
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
        if solution is None:
            self.send_error()
            return

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

class StartRunHandler(RunHandler):
    def _get_solution(self):
        return _start_solution
    def _publishable(self):
        return False

class PublishedRunHandler(RunHandler):
    def _get_solution(self):
        return _published_solution

    def _publishable(self):
        return False

class PublishingRunHandler(RunHandler):
    def _get_solution(self):
        return _publishing_solution

    def _publishable(self):
        return False

    @gen.coroutine
    def get(self):
        publish_key = self.get_cookie(BRPY_PUBLISH_PROJECT_KEY)
        if _publisher.validate(user=self.current_user, key=publish_key):
            yield super(PublishingRunHandler, self).get()
            return
        self.send_error()

    @gen.coroutine
    def post(self):
        publish_key = self.get_cookie(BRPY_PUBLISH_PROJECT_KEY)
        if _publisher.validate(user=self.current_user, key=publish_key):
            yield super(PublishingRunHandler, self).post()
            return
        self.send_error()

class IndexHandler(AllHandler):
    @gen.coroutine
    def get(self):
        self.write(INDEX_HTML)

class RootIndexHandler(AllHandler):
    @gen.coroutine
    def get(self, v):
        if self.current_user is None:
            self.redirect('/start/')
            return
        self.write(INDEX_HTML)

class RestrictAccessHandler(AllHandler):
    @gen.coroutine
    def get(self, v):
        self.send_error()

    @gen.coroutine
    def post(self, v):
        self.send_error()

if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/export", ExportHandler),
        (r"/user", UserInfoHandler),
        (r"/login", LoginHandler),
        (r"/logout", LogoutHandler),
        (r"/run", RunHandler),
        (r"/start/run", StartRunHandler),
        (r"/published/run", PublishedRunHandler),
        (r"/publish/run", PublishingRunHandler),
        (r"/start/", IndexHandler),
        (r"/published/", IndexHandler),
        (r"/tools/(.*)", RestrictAccessHandler),
        (r"/($)", RootIndexHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {'path': './'})
    ], cookie_secret=get_random_state())
    app.listen(PORT)
    _io_loop.start()
