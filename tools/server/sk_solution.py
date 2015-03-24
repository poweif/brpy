from apiclient.discovery import build
from apiclient.http import MediaIoBaseUpload
from apiclient.http import MediaFileUpload
import io
import simplejson as json
import httplib2
import os
import shutil

from abc import ABCMeta, abstractmethod

import tornado.web, tornado.ioloop
from tornado import gen
import motor

EXAMPLE_MAIN_PY = """print 'hello world'"""
EXAMPLE_PROJ_JSON = """[{"src": [{"file": "main.py", "height": 100}], "currentFile": 0, "name": "block"}]"""
EXAMPLE_SOLUTION_JSON = """{"currentProject": 0, "projects": ["example"]}"""

class SkSolution():
    __metaclass__ = ABCMeta
    _SOLUTION_JSON = 'solution.json'
    _DEFAULT_PROJ = 'default'
    _PROJ_JSON = 'project.json'
    _MAIN_PY = 'main.py'
    _BRPY_APP_DIR = 'brpy_app_data'
    _APP_KEY = 'brpy_app'
    _ROOT_KEY = 'root'
    _TEXT_MIME = "text/plain"

    _PROJ_BLOCK_NAME = "name"
    _PROJ_SRC = "src"
    _PROJ_DEFAULT_FILE = "currentFile"

    _DEFAULT_BLOCK ="default-block"

    def __init__(self, read_only=False):
        self._read_only = read_only
        self._files = {}

    def _key(self, parent_id, file_name):
        return parent_id + '_' +  file_name

    def _remove_key(self, parent_path, file_name):
        self._files.pop(self._key(parent_path, file_name), None)

    def _add_key(self, key, value):
        self._files[key] = value
        return value

    def _root(self):
        if self._ROOT_KEY in self._files:
            return self._files[self._ROOT_KEY]
        return self._root_impl()

    @gen.coroutine
    def _app(self):
        if self._APP_KEY in self._files:
            raise gen.Return(self._files[self._APP_KEY])
        raise gen.Return((yield self._app_impl()))

    @gen.coroutine
    def _create_folder(self, parent_id, folder_name):
        if self._read_only: raise gen.Return({})

        key = self._key(parent_id, folder_name)
        res = yield self._create_folder_impl(parent_id, folder_name)
        self._add_key(key, res)
        raise gen.Return(res)

    @gen.coroutine
    def _find_file_id(self, folder_id, title):
        key = self._key(folder_id, title)
        if key in self._files:
            raise gen.Return(self._files[key])

        res = yield self._find_file_id_impl(folder_id, title)
        raise gen.Return(res)

    @gen.coroutine
    def create_project(self, proj_name):
        if self._read_only: raise gen.Return({})

        folder_id = yield self._create_folder(
            (yield self._app()), proj_name)
        proj_id = yield self._update_text_file_impl(
            folder_id, self._PROJ_JSON, EXAMPLE_PROJ_JSON)
        main_id = yield self._update_text_file_impl(
            folder_id, self._MAIN_PY, EXAMPLE_MAIN_PY)
        raise gen.Return(folder_id)

    @gen.coroutine
    def _find_project_id(self, proj_name):
        proj_folder_id = yield self._find_file_id(
            (yield self._app()), proj_name)
        if proj_folder_id is None:
            res = yield self.create_project(proj_name)
            raise gen.Return(res)
        raise gen.Return(proj_folder_id)

    @gen.coroutine
    def read_solution(self, create=True):
        app_id = yield self._app()
        solution_file_id = yield self._find_file_id(
            app_id, self._SOLUTION_JSON)
        if solution_file_id is None and create and not self._read_only:
            solution_json = EXAMPLE_SOLUTION_JSON
            yield self._update_text_file_impl(
                (yield self._app()), self._SOLUTION_JSON, solution_json)
            solution = json.loads(solution_json)
            yield self.create_project(solution['projects'][0])
            raise gen.Return(solution)

        if solution_file_id is not None:
            solution = json.loads(
                (yield self._read_text_file_impl(solution_file_id)))
            raise gen.Return(solution)
        raise gen.Return(None)

    @gen.coroutine
    def update_solution(self, new_sol):
        if self._read_only: raise gen.Return({})

        solution = yield self.read_solution()
        if solution is None:
            raise gen.Return(None)

        for key in (x for x in new_sol if x in solution):
            solution[key] = new_sol[key]

        res = yield self._update_text_file_impl(
            (yield self._app()), self._SOLUTION_JSON, json.dumps(solution))
        raise gen.Return(res)

    @gen.coroutine
    def rename_project(self, old_name, new_name):
        if self._read_only: raise gen.Return({})

        res = yield self._rename_file_impl(
            (yield self._app()), old_name, new_name)
        raise gen.Return(res)

    @gen.coroutine
    def delete_project(self, proj):
        if self._read_only: raise gen.Return({})

        res = yield self._delete_file_impl(
            (yield self._app()), proj)
        raise gen.Return(res)

    @gen.coroutine
    def read_file(self, proj, fname):
        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(None)

        file_id = yield self._find_file_id(proj_id, fname)
        if file_id is None:
            raise gen.Return(None)

        res = yield self._read_text_file_impl(file_id)
        raise gen.Return(res)

    @gen.coroutine
    def write_file(self, proj, fname, text):
        if self._read_only: raise gen.Return({})

        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(None)
        res = yield self._update_text_file_impl(proj_id, fname, text)
        raise gen.Return(res)

    @gen.coroutine
    def rename_file(self, proj, old_name, new_name):
        if self._read_only: raise gen.Return({})

        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(None)
        res = yield self._rename_file_impl(proj_id, old_name, new_name)
        raise gen.Return(res)

    @gen.coroutine
    def delete_file(self, proj, fname):
        if self._read_only: raise gen.Return({})

        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(False)
        res = self._delete_file_impl(proj_id, fname)
        raise gen.Return(res is not None)

    @gen.coroutine
    def update_project(self, proj, proj_data):
        if self._read_only: raise gen.Return({})

        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(None)

        res = yield self._update_text_file_impl(
            proj_id, self._PROJ_JSON, json.dumps(proj_data))
        raise gen.Return(res)

    @gen.coroutine
    def read_project(self, proj):
        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(None)

        proj_file_id = yield self._find_file_id(proj_id, self._PROJ_JSON)
        if proj_file_id is None:
            raise gen.Return(None)

        res = json.loads((yield self._read_text_file_impl(proj_file_id)))
        raise gen.Return(res)

    @abstractmethod
    def _root_impl(self): pass

    @abstractmethod
    def _app_impl(self): pass

    @abstractmethod
    def _find_file_id_impl(self, folder_id, title): pass

    @abstractmethod
    def _create_folder_impl(self, parent_id, folder_name): pass

    @abstractmethod
    def _update_text_file_impl(self, parent_id, file_name, text): pass

    @abstractmethod
    def _rename_file_impl(self, parent_id, old_name, new_name): pass

    @abstractmethod
    def _delete_file_impl(self, parent_id, file_name): pass

    @abstractmethod
    def _read_text_file_impl(self, file_id): pass


def _build_drive_service(credentials):
    return build(
        serviceName = 'drive', version='v2',
        http = credentials.authorize(httplib2.Http()))

class GdriveSkSolution(SkSolution):
    def __init__(self, cred, read_only=False):
        super(GdriveSkSolution, self).__init__(read_only=read_only)
        self.__cred = cred
        self.__drive = _build_drive_service(cred)

    def _root_impl(self):
        self._files[self._ROOT_KEY] =\
            self.__drive.about().get().execute()['rootFolderId']
        return self._files[self._ROOT_KEY]

    @gen.coroutine
    def _app_impl(self):
        iid = yield self._find_file_id_impl(
            self._root(), self._BRPY_APP_DIR)

        # Always create when not found
        if iid is None:
            iid = yield self._create_folder(self._root(), self._BRPY_APP_DIR)

        raise gen.Return(self._add_key(self._APP_KEY, iid))

    @gen.coroutine
    def _find_file_id_impl(self, folder_id, title):
        key = self._key(folder_id, title)
        param = {"q": "title = '%s' and trashed = false" % title}
        itemsp = self.__drive.children().list(
            folderId=folder_id,
            **param).execute()
        items = itemsp['items']
        if len(items) < 1:
            raise gen.Return(self._add_key(key, None))
        raise gen.Return(self._add_key(key, items[0]['id']))

    @gen.coroutine
    def _create_folder_impl(self, parent_id, folder_name):
        res = self.__drive.files().insert(
            body = {
                'title': folder_name,
                'parents': [{"id": parent_id}],
                'mimeType': "application/vnd.google-apps.folder"
            }).execute()
        raise gen.Return(res['id'])

    @gen.coroutine
    def _update_text_file_impl(self, parent_id, file_name, text):
        if type(text) is str:
            text = unicode(text)
        output = io.StringIO(text)
        mime = self._TEXT_MIME
        file_id = yield self._find_file_id(parent_id, file_name)

        if file_id is None:
            dfile = self.__drive.files().insert(
                media_body=MediaIoBaseUpload(output, mime),
                body={
                    'title': file_name,
                    'parents': [{"id": parent_id}],
                    'mimeType': mime}).execute()
            output.close()
            raise gen.Return(
                self._add_key(self._key(parent_id, file_name), dfile['id']))

        self.__drive.files().update(
            fileId=file_id,
            media_body=MediaIoBaseUpload(output, mime)).execute()
        output.close()
        raise gen.Return(file_id)

    @gen.coroutine
    def _rename_file_impl(self, parent_id, old_name, new_name):
        file_id = yield self._find_file_id(parent_id, old_name)
        if file_id is None:
            raise gen.Return(None)
        tbody = self.__drive.files().get(fileId=file_id).execute()
        tbody['title'] = new_name
        self.__drive.files().update(fileId=file_id, body=tbody).execute()
        raise gen.Return(file_id)

    @gen.coroutine
    def _delete_file_impl(self, parent_id, file_name):
        file_id = yield self._find_file_id(parent_id, file_name)
        if file_id is None:
            raise gen.Return(None)
        self.__drive.files().trash(fileId=file_id).execute()
        raise gen.Return(file_id)

    @gen.coroutine
    def _read_text_file_impl(self, file_id):
        tfile = self.__drive.files().get(fileId=file_id).execute()
        download_url = tfile['downloadUrl']
        if download_url is None:
            print "Cannot download " + tfile['title']
            raise gen.Return(None)

        resp, content = self.__drive._http.request(download_url)
        if resp.status == 200:
            raise gen.Return(content)

        print 'An error occurred: %s' % resp
        raise gen.Return(None)

class DevSkSolution(SkSolution):
    """Encapsulation of a brpy Solution for developers"""

    def __init__(self, root_dir, read_only=False):
        super(DevSkSolution, self).__init__(read_only=read_only)
        self.__root_dir = root_dir
        self.__file_cache = {}
        # The root directory must exist
        assert os.access(root_dir, os.F_OK)

    def _write_key(self, parent_path, file_name):
        key = self._key(parent_path, file_name)
        self._files[key] = parent_path + "/" + file_name
        return self._files[key]

    def _root_impl(self):
        self._files[self._ROOT_KEY] = './'
        return self._files[self._ROOT_KEY]

    @gen.coroutine
    def _app_impl(self):
        raise gen.Return(self.__root_dir)

    @gen.coroutine
    def _find_file_id_impl(self, parent_path, title):
        if parent_path is None or not title in os.listdir(parent_path):
            raise gen.Return(None)
        raise gen.Return(self._write_key(parent_path, title))

    @gen.coroutine
    def _create_folder_impl(self, parent_path, folder_name):
        path = parent_path + "/" + folder_name
        if not os.access(path, os.F_OK):
            os.mkdir(path)
        raise gen.Return(self._write_key(parent_path, folder_name))

    @gen.coroutine
    def _update_text_file_impl(self, parent_path, file_name, text):
        if self._read_only: raise gen.Return({})

        path = parent_path + "/" + file_name
        if not os.access(path, os.F_OK):
            self._write_key(parent_path, file_name)
        with open(path, "w") as fout:
            fout.write(text)
        raise gen.Return(path)

    @gen.coroutine
    def _rename_file_impl(self, parent_path, old_name, new_name):
        if self._read_only: raise gen.Return({})

        old_path = yield self._find_file_id(parent_path, old_name)
        if old_path is None:
            raise gen.Return(None)
        new_path = parent_path + "/" + new_name
        os.rename(old_path, new_path)
        self._remove_key(parent_path, old_name)
        raise gen.Return(self._write_key(parent_path, new_name))

    @gen.coroutine
    def _delete_file_impl(self, parent_path, file_name):
        if self._read_only: raise gen.Return({})

        file_path = yield self._find_file_id(parent_path, file_name)
        if file_path is None:
            raise gen.Return(None)
        if os.path.isfile(file_path):
            os.remove(file_path)
        else:
            shutil.rmtree(file_path)
        self._remove_key(parent_path, file_name)
        raise gen.Return({})

    @gen.coroutine
    def _read_text_file_impl(self, file_path):
        if not os.access(file_path, os.F_OK):
            raise gen.Return(None)

        if self._read_only and file_path in self.__file_cache:
            raise gen.Return(self.__file_cache[file_path])

        with open(file_path, "r") as f:
            content = f.read()
            if self._read_only:
                self.__file_cache[file_path] = content
            raise gen.Return(content)

class MongoDBSkSolution(SkSolution):
    def __init__(self, user, db, read_only=False):
        super(MongoDBSkSolution, self).__init__(read_only=read_only)
        self.__user = user
        self.__db = db

    def _root_impl(self):
        return self._add_key(self._ROOT_KEY, 'root')

    @gen.coroutine
    def _app_impl(self):
        raise gen.Return(self._BRPY_APP_DIR)

    @gen.coroutine
    def _find_file_id_impl(self, parent_id, title):
        if parent_id == (yield self._app())\
           and title != self._SOLUTION_JSON:
            self._add_key(self._key(parent_id, title), title)
            raise gen.Return(title)

        cursor = self.__db.files.find(
            {'user': self.__user, 'parent': parent_id,
             'title': title}, {'_id' : 1})

        if not (yield cursor.fetch_next):
            raise gen.Return(None)
        obj = cursor.next_object()
        iid = obj['_id']
        raise gen.Return(self._add_key(self._key(parent_id, title), iid))

    @gen.coroutine
    def _create_folder_impl(self, parent_id, folder):
        self._add_key(self._key(parent_id, folder), folder)
        raise gen.Return(folder)

    @gen.coroutine
    def _update_text_file_impl(self, parent_id, title, text):
        iid = yield self._find_file_id(parent_id, title)
        content = {'user': self.__user, 'parent': parent_id,
                   'title': title, 'text': text}
        if iid is not None:
            content['_id'] = iid

        result = yield self.__db.files.save(content)
        if result is not None:
            self._add_key(self._key(parent_id, title), result)
        raise gen.Return(result)

    @gen.coroutine
    def _rename_file_impl(self, parent_id, old_name, new_name):
        iid = yield self._find_file_id(parent_id, old_name)
        if old_name != iid:
            spec = {'_id': iid}
            yield self.__db.files.update(spec, {'$set': {'title': new_name}})
        else: # renaming a parent
            spec = {'user': self.__user, 'parent': old_name}
            iid = new_name
            yield self.__db.files.update(
                spec, {'$set': {'parent': new_name}}, multi=True)
        self._remove_key(parent_id, old_name)
        raise gen.Return(self._add_key(self._key(parent_id, new_name), iid))

    @gen.coroutine
    def _delete_file_impl(self, parent_id, file_name):
        iid = yield self._find_file_id(parent_id, file_name)
        if iid == file_name:
            yield self.__db.files.remove({'parent': file_name})
            raise gen.Return(True)
        yield self.__db.files.remove(iid)
        raise gen.Return(True)

    @gen.coroutine
    def _read_text_file_impl(self, file_id):
        res = yield self.__db.files.find_one({'_id': file_id}, {'text': 1})
        raise gen.Return(res['text'])


class HierarchicalSkSolution(SkSolution):
    _DELAY = .2
    def __init__(self, io_loop, l1, l2):
        super(HierarchicalSkSolution, self).__init__()
        self._io_loop = io_loop
        self._l1 = l1
        self._l2 = l2

    @gen.coroutine
    def create_project(self, proj_name):
        raise gen.Return((yield self._l1.create_project(proj_name)))

    @gen.coroutine
    def read_solution(self, create=True):
        l1_res = yield self._l1.read_solution(create=False)
        if l1_res is not None:
            raise gen.Return(l1_res)

        l2_res = yield self._l2.read_solution(create)
        yield self._l1.update_solution(l2_res)
        raise gen.Return(l2_res)

    @gen.coroutine
    def update_solution(self, new_sol):
        def run():
            self._l2.update_solution(new_sol)
        self._io_loop.call_later(self._DELAY, run)
        raise gen.Return((yield self._l1.update_solution(new_sol)))

    @gen.coroutine
    def rename_project(self, old_name, new_name):
        def run():
            self._l2.rename_project(old_name, new_name)
        self._io_loop.call_later(self._DELAY, run)
        raise gen.Return((yield self._l1.rename_project(old_name, new_name)))

    @gen.coroutine
    def delete_project(self, proj):
        def run():
            self._l2.delete_project(proj)
        self._io_loop.call_later(self._DELAY, run)
        raise gen.Return((yield self._l1.delete_project(proj)))

    @gen.coroutine
    def read_file(self, proj, fname):
        l1_res = yield self._l1.read_file(proj, fname)
        if l1_res is not None:
            raise gen.Return(l1_res)
        l2_res = yield self._l2.read_file(proj, fname)

        yield self._l1.write_file(proj, fname, l2_res)
        raise gen.Return(l2_res)

    @gen.coroutine
    def write_file(self, proj, fname, text):
        def run():
            self._l2.write_file(proj, fname, text)
        self._io_loop.call_later(self._DELAY, run)
        raise gen.Return((yield self._l1.write_file(proj, fname, text)))

    @gen.coroutine
    def rename_file(self, proj, old_name, new_name):
        def run():
            self._l2.rename_file(proj, old_name, new_name)
        self._io_loop.call_later(self._DELAY, run)
        raise gen.Return(
            (yield self._l1.rename_file(proj, old_name, new_name)))

    @gen.coroutine
    def delete_file(self, proj, fname):
        def run():
            self._l2.delete_file(proj, fname)
        self._io_loop.call_later(self._DELAY, run)
        raise gen.Return((yield self._l1.delete_file(proj, fname)))

    @gen.coroutine
    def update_project(self, proj, proj_data):
        def run():
            self._l2.update_project(proj, proj_data)
        self._io_loop.call_later(self._DELAY, run)
        raise gen.Return((yield self._l1.update_project(proj, proj_data)))

    @gen.coroutine
    def read_project(self, proj):
        l1_res = yield self._l1.read_project(proj)
        if l1_res is not None:
            raise gen.Return(l1_res)
        l2_res = yield self._l2.read_project(proj)

        yield self._l1.update_project(proj, l2_res)
        raise gen.Return(l2_res)

    def _root_impl(self): pass
    def _app_impl(self): pass
    def _find_file_id_impl(self, folder_id, title): pass
    def _create_folder_impl(self, parent_id, folder_name): pass
    def _update_text_file_impl(self, parent_id, file_name, text): pass
    def _rename_file_impl(self, parent_id, old_name, new_name): pass
    def _delete_file_impl(self, parent_id, file_name): pass
    def _read_text_file_impl(self, file_id): pass
