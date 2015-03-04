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

class SkSolution():
    __metaclass__ = ABCMeta
    _SOLUTION_JSON = 'solution.json'
    _DEFAULT_PROJ = 'default'
    _PROJ_JSON = 'project.json'
    _MAIN_PY = 'main.py'
    _SKULPT_GL_APP_DIR = 'skulptgl_app_data'
    _TEXT_MIME = "text/plain"

    _PROJ_BLOCK_NAME = "name"
    _PROJ_SRC = "src"
    _PROJ_DEFAULT_FILE = "currentFile"

    _DEFAULT_BLOCK ="default-block"

    def __init__(self):
        self._files = {}

    def _key(self, parent_id, file_name):
        return parent_id + '_' +  file_name

    def _root(self):
        if 'root' in self._files:
            return self._files['root']
        return self._root_impl()

    def _app(self):
        app_id = self._find_file_id(self._root(), self._SKULPT_GL_APP_DIR)
        if app_id is None:
            app_id = self._create_folder(self._root(), self._SKULPT_GL_APP_DIR)
        return app_id

    # Find the first file (id) matching [title] in a folder.  Return None if
    # not found.
    def _find_file_id(self, folder_id, title):
        key = self._key(folder_id, title)
        if key in self._files:
            return self._files[key]
        return self._find_file_id_impl(folder_id, title)

    def _create_folder(self, parent_id, folder_name):
        key = self._key(parent_id, folder_name)
        res = self._files[key] =\
            self._create_folder_impl(parent_id, folder_name)
        return res

    def create_project(self, proj_name):
        proj_folder_id = self._create_folder(self._app(), proj_name)

        with open('./sample/default/' + self._MAIN_PY) as main_py:
            self._update_text_file_impl(proj_folder_id, self._MAIN_PY,
                                       main_py.read())

        with open('./sample/default/' + self._PROJ_JSON) as proj_json:
            self._update_text_file_impl(proj_folder_id, self._PROJ_JSON,
                                       proj_json.read())
        return True

    def _find_project_id(self, proj_name, create=False):
        proj_folder_id = self._find_file_id(self._app(), proj_name)
        if proj_folder_id is None and create:
            return self.create_project(proj_name)
        return proj_folder_id

    def read_solution(self):
        solution_file_id = self._find_file_id(self._app(), self._SOLUTION_JSON)
        if solution_file_id is None:
            with open('./sample/' + self._SOLUTION_JSON, 'r') as solution_json:
                solution = json.loads(solution_json.read())
                self._update_text_file_impl(self._app(), self._SOLUTION_JSON,
                                            json.dumps(solution))
                return solution
        return json.loads(self._read_text_file_impl(solution_file_id))

    def update_solution(self, new_sol):
        solution = self.read_solution()
        for key in (x for x in new_sol if x in solution):
            solution[key] = new_sol[key]

        return self._update_text_file_impl(self._app(), self._SOLUTION_JSON,
                                           json.dumps(solution))

    def rename_project(self, old_name, new_name):
        return self._rename_file_impl(self._app(), old_name, new_name)\
            is not None

    def delete_project(self, proj):
        return self._delete_file_impl(self._app(), proj) is not None

    def read_file(self, proj, fname):
        proj_id = self._find_project_id(proj)
        if proj_id is None:
            return None
        file_id = self._find_file_id(proj_id, fname)
        if file_id is None:
            return None
        return self._read_text_file_impl(file_id)

    def write_file(self, proj, fname, text):
        proj_id = self._find_project_id(proj)
        if proj_id is None:
            return False
        return self._update_text_file_impl(proj_id, fname, text) is not None

    def rename_file(self, proj, old_name, new_name):
        proj_id = self._find_project_id(proj)
        if proj_id is None:
            return False
        return self._rename_file_impl(proj_id, old_name, new_name) is not None

    def delete_file(self, proj, fname):
        proj_id = self._find_project_id(proj)
        if proj_id is None:
            return False
        return self._delete_file_impl(proj_id, fname) is not None

    def update_project(self, proj, proj_data):
        proj_id = self._find_project_id(proj)
        return self._update_text_file_impl(
            proj_id, self._PROJ_JSON, json.dumps(proj_data)) is not None

    def read_project(self, proj, create_if_not_found=False):
        proj_id = self._find_project_id(proj, create=create_if_not_found)
        if proj_id is None:
            return None
        proj_file_id = self._find_file_id(proj_id, self._PROJ_JSON)
        if proj_file_id is None:
            return None
        return json.loads(self._read_text_file_impl(proj_file_id))

    @abstractmethod
    def _root_impl(self): pass

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
    """Encapsulation of a Skulptgl Solution on Google Drive"""

    def __init__(self, cred):
        super(GdriveSkSolution, self).__init__()
        self.__cred = cred
        self.__drive = _build_drive_service(cred)
        self.read_project(self._DEFAULT_PROJ, create_if_not_found=True)

    def _root_impl(self):
        self._files['root'] =\
            self.__drive.about().get().execute()['rootFolderId']
        return self._files['root']

    def _find_file_id_impl(self, folder_id, title):
        key = self._key(folder_id, title)
        param = {"q": "title = '%s' and trashed = false" % title}
        itemsp = self.__drive.children().list(
            folderId=folder_id,
            **param).execute()
        items = itemsp['items']
        if len(items) < 1:
            self._files[key] = None
            return None
        self._files[key] = items[0]['id']
        return self._files[key]

    def _create_folder_impl(self, parent_id, folder_name):
        res = self.__drive.files().insert(
            body = {
                'title': folder_name,
                'parents': [{"id": parent_id}],
                'mimeType': "application/vnd.google-apps.folder"
            }).execute()
        return res['id']

    def _update_text_file_impl(self, parent_id, file_name, text):
        if type(text) is str:
            text = unicode(text)
        output = io.StringIO(text)
        mime = self._TEXT_MIME
        file_id = self._find_file_id(parent_id, file_name)

        if file_id is None:
            dfile = self.__drive.files().insert(
                media_body=MediaIoBaseUpload(output, mime),
                body={
                    'title': file_name,
                    'parents': [{"id": parent_id}],
                    'mimeType': mime}).execute()
            output.close()
            self._files[self._key(parent_id, file_name)] = dfile['id']
            return dfile['id']

        self.__drive.files().update(
            fileId=file_id,
            media_body=MediaIoBaseUpload(output, mime)).execute()
        output.close()
        return file_id

    def _rename_file_impl(self, parent_id, old_name, new_name):
        file_id = self._find_file_id(parent_id, old_name)
        if file_id is None:
            return None
        tbody = self.__drive.files().get(fileId=file_id).execute()
        tbody['title'] = new_name
        self.__drive.files().update(fileId=file_id, body=tbody).execute()
        return file_id

    def _delete_file_impl(self, parent_id, file_name):
        file_id = self._find_file_id(parent_id, file_name)
        if file_id is None:
            return None
        self.__drive.files().trash(fileId=file_id).execute()
        return file_id

    def _read_text_file_impl(self, file_id):
        tfile = self.__drive.files().get(fileId=file_id).execute()
        print "reading: " + tfile['title']
        download_url = tfile['downloadUrl']
        if download_url is None:
            print "Cannot download " + tfile['title']
            return None

        resp, content = self.__drive._http.request(download_url)
        if resp.status == 200:
            print 'Status: %s' % resp['status']
            return content

        print 'An error occurred: %s' % resp
        return None

class DevSkSolution(SkSolution):
    """Encapsulation of a Skulptgl Solution for developers"""

    def __init__(self, root_dir, read_only=False):
        super(DevSkSolution, self).__init__()
        self.__root_dir = root_dir
        self.__read_only = read_only
        self.__file_cache = {}
        # The root directory must exist
        assert os.access(root_dir, os.F_OK)
        self.read_project(self._DEFAULT_PROJ, create_if_not_found=True)

    def _write_key(self, parent_path, file_name):
        key = self._key(parent_path, file_name)
        self._files[key] = parent_path + "/" + file_name
        return self._files[key]

    def _remove_key(self, parent_path, file_name):
        self._files.pop(self._key(parent_path, file_name), None)

    def _root_impl(self):
        self._files['root'] = self.__root_dir
        return self._files['root']

    def _find_file_id_impl(self, parent_path, title):
        if parent_path is None or not title in os.listdir(parent_path):
            return None
        return self._write_key(parent_path, title)

    def _create_folder_impl(self, parent_path, folder_name):
        if self.__read_only: return True

        path = parent_path + "/" + folder_name
        if os.access(path, os.F_OK):
            return self._write_key(parent_path, folder_name)
        os.mkdir(path)
        return self._write_key(parent_path, folder_name)

    def _update_text_file_impl(self, parent_path, file_name, text):
        if self.__read_only: return True

        path = parent_path + "/" + file_name
        if not os.access(path, os.F_OK):
            self._write_key(parent_path, file_name)
        with open(path, "w") as fout:
            fout.write(text)
        return path

    def _rename_file_impl(self, parent_path, old_name, new_name):
        if self.__read_only: return True

        old_path = self._find_file_id(parent_path, old_name)
        if old_path is None:
            return None
        new_path = parent_path + "/" + new_name
        os.rename(old_path, new_path)
        self._remove_key(parent_path, old_name)
        return self._write_key(parent_path, new_name)

    def _delete_file_impl(self, parent_path, file_name):
        if self.__read_only: return True

        file_path = self._find_file_id(parent_path, file_name)
        if file_path is None:
            return False
        if os.path.isfile(file_path):
            os.remove(file_path)
        else:
            shutil.rmtree(file_path)
        self._remove_key(parent_path, file_name)
        return True

    def _read_text_file_impl(self, file_path):
        if not os.access(file_path, os.F_OK):
            return None

        if self.__read_only and file_path in self.__file_cache:
            return self.__file_cache[file_path]

        with open(file_path, "r") as f:
            content = f.read()
            if self.__read_only:
                self.__file_cache[file_path] = content
            return content

class MongoDBSkSolution(SkSolution):
    """Encapsulation of a Skulptgl Solution on Google Drive"""

    def __init__(self, user, db):
        super(MongoDBSkSolution, self).__init__()
        self.__user = user
        self.__db = db
        future = self.read_project(self._DEFAULT_PROJ,
                                   create_if_not_found=True)
        future.add_done_callback(lambda f: True)

    def _remove_key(self, parent_path, file_name):
        self._files.pop(self._key(parent_path, file_name), None)

    @gen.coroutine
    def _app(self):
        app_id = yield self._find_file_id(self._root(), self._SKULPT_GL_APP_DIR)
        if app_id is None:
            app_id = yield self._create_folder(
                self._root(), self._SKULPT_GL_APP_DIR)
        raise gen.Return(app_id)

    @gen.coroutine
    def _create_folder(self, parent_id, folder_name):
        key = self._key(parent_id, folder_name)
        res = yield self._create_folder_impl(parent_id, folder_name)
        self._files[key] = res
        raise gen.Return(res)

    @gen.coroutine
    def create_project(self, proj_name):
        proj_folder_id = yield self._create_folder(
            (yield self._app()), proj_name)

        with open('./sample/default/' + self._MAIN_PY) as main_py:
            yield self._update_text_file_impl(proj_folder_id, self._MAIN_PY,
                                              main_py.read())

        with open('./sample/default/' + self._PROJ_JSON) as proj_json:
            yield self._update_text_file_impl(proj_folder_id, self._PROJ_JSON,
                                              proj_json.read())

        print('creating------------ project ' + proj_folder_id)

        raise gen.Return(proj_folder_id)

    @gen.coroutine
    def _find_project_id(self, proj_name, create=False):
        proj_folder_id = yield self._find_file_id(
            (yield self._app()), proj_name)
        if proj_folder_id is None and create:
            res = yield self.create_project(proj_name)
            raise gen.Return(res)
        raise gen.Return(proj_folder_id)

    @gen.coroutine
    def _find_file_id(self, folder_id, title):
        key = self._key(folder_id, title)
        if key in self._files:
            raise gen.Return(self._files[key])
        res = yield self._find_file_id_impl(folder_id, title)
        raise gen.Return(res)

    @gen.coroutine
    def read_solution(self):
        solution_file_id = yield self._find_file_id(
            (yield self._app()), self._SOLUTION_JSON)
        if solution_file_id is None:
            with open('./sample/' + self._SOLUTION_JSON, 'r') as solution_json:
                solution = json.loads(solution_json.read())
                yield self._update_text_file_impl(
                    (yield self._app()), self._SOLUTION_JSON,
                    json.dumps(solution))
                raise gen.Return(solution)
        print '0000000000000 ' + str(solution_file_id)
        solution = json.loads((yield self._read_text_file_impl(solution_file_id)))
        raise gen.Return(solution)

    @gen.coroutine
    def update_solution(self, new_sol):
        solution = yield self.read_solution()
        print 'solution', solution
        for key in (x for x in new_sol if x in solution):
            solution[key] = new_sol[key]

        res = yield self._update_text_file_impl(
            (yield self._app()), self._SOLUTION_JSON, json.dumps(solution))
        raise gen.Return(res)

    @gen.coroutine
    def rename_project(self, old_name, new_name):
        res = yield self._rename_file_impl(
            (yield self._app()), old_name, new_name)
        raise gen.Return(res is not None)

    @gen.coroutine
    def delete_project(self, proj):
        res = yield self._delete_file_impl(
            (yield self._app()), proj)
        raise gen.Return(res is not None)

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
        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(False)
        res = yield self._update_text_file_impl(proj_id, fname, text)
        raise gen.Return(res is not None)

    @gen.coroutine
    def rename_file(self, proj, old_name, new_name):
        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(False)
        res = yield self._rename_file_impl(proj_id, old_name, new_name)
        raise gen.Return(res is not None)

    @gen.coroutine
    def delete_file(self, proj, fname):
        proj_id = yield self._find_project_id(proj)
        if proj_id is None:
            raise gen.Return(False)
        res = self._delete_file_impl(proj_id, fname)
        raise gen.Return(res is not None)

    @gen.coroutine
    def update_project(self, proj, proj_data):
        proj_id = yield self._find_project_id(proj)
        print '++++++++++++++++ ' + str(proj_id) + ' 333333333333333 ' + str(proj_data)
        res = yield self._update_text_file_impl(
            proj_id, self._PROJ_JSON, json.dumps(proj_data))
        print 'rrrrrrrrrrrrrrrrrr ' + str(res)
        raise gen.Return(res is not None)

    @gen.coroutine
    def read_project(self, proj, create_if_not_found=False):
        proj_id = yield self._find_project_id(proj, create=create_if_not_found)
        if proj_id is None:
            raise gen.Return(None)

        print '----------------------- '  + str(proj_id)
        proj_file_id = yield self._find_file_id(proj_id, self._PROJ_JSON)
        if proj_file_id is None:
            raise gen.Return(None)

        res = json.loads((yield self._read_text_file_impl(proj_file_id)))
        raise gen.Return(res)

    def _root_impl(self):
        self._files['root'] = 'root'
        return self._files['root']

    @gen.coroutine
    def _find_file_id_impl(self, parent_id, title):
        cursor = self.__db.files.find(
            {'user': self.__user, 'parent': parent_id,
             'title': title}, {'_id' : 1})

        if not (yield cursor.fetch_next):
            raise gen.Return(None)
        obj = cursor.next_object()
        print '33333333333333333333' + str(obj)
        iid = obj['_id']
        self._files[self._key(parent_id, title)] = iid
        raise gen.Return(iid)

    @gen.coroutine
    def _create_folder_impl(self, parent_id, folder):
        raise gen.Return(folder)

    @gen.coroutine
    def _update_text_file_impl(self, parent_id, title, text):
        iid = yield self._find_file_id_impl(parent_id, title)
        content = {'user': self.__user, 'parent': parent_id,
                   'title': title, 'text': text}
        if iid is not None:
            content['_id'] = iid

        result = yield self.__db.files.save(content)
        if result is not None:
            self._files[self._key(parent_id, title)] = result

        raise gen.Return(result)

    @gen.coroutine
    def _rename_file_impl(self, parent_id, old_name, new_name):
        iid = yield self._find_file_id_impl(parent_id, old_name)
        spec = {'_id': iid}
        yield self.__db.files.update(spec, {'$set': {'title': new_name}})
        self._remove_key(parent_id, old_name)
        self._files[self._key(parent_id, new_name)] = iid
        raise gen.Return(iid)

    @gen.coroutine
    def _delete_file_impl(self, parent_id, file_name):
        iid = yield self._find_file_id_impl(parent_id, old_name)
        yield self.__db.files.remove(iid)
        raise gen.Return(True)

    @gen.coroutine
    def _read_text_file_impl(self, file_id):
        res = yield self.__db.files.find_one({'_id': file_id}, {'text': 1})
        raise gen.Return(res['text'])
