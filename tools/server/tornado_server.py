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
POST_LOGIN_URI = HOME_URI + '/login'
SHOW_URI = HOME_URI + '/show'
SESSION_KEY = 'skulpt-gl-key'
g_session = {}

import tornado.ioloop
import tornado.web

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

application = tornado.web.Application([
    (r"/", MainHandler),
])

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
