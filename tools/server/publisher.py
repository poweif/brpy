import simplejson as json
import tornado.ioloop
import tornado.web
from tornado import gen
import motor
import random
import string

def get_random_state():
    return ''.join(random.choice(string.ascii_uppercase + string.digits)
                   for x in xrange(32))

class ProjectPublisher():
    def __init__(self, db):
        self.__db = db

    @gen.coroutine
    def begin(self, user):
        key = get_random_state()
        yield self.__db.publish.save({'user': user, 'state': key})
        raise gen.Return(key)

    @gen.coroutine
    def end(self, user, key):
        yield self.__db.publish.remove({'state': key})

    @gen.coroutine
    def validate(self, user, key):
        cursor = self.__db.publish.find({'user': user, 'state': key})
        if not (yield cursor.fetch_next):
            raise gen.Return(False)
        raise gen.Return(True)
