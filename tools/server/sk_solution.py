from apiclient.discovery import build
from apiclient.http import MediaIoBaseUpload
from apiclient.http import MediaFileUpload
import io
import simplejson as json
import httplib2
import os

from abc import ABCMeta, abstractmethod

class SkSolution():
    __metaclass__ = ABCMeta
    _SOLUTION_JSON = 'solution.json'
    _DEFAULT_PROJ = 'default'
    _PROJ_JSON = 'project.json'
    _MAIN_PY = 'main.py'
    _SKULPT_GL_APP_DIR = 'skulptgl_app_data'
    _TEXT_MIME = "text/plain"

    _PROJ_NAME = "name"
    _PROJ_SRC = "src"
    _PROJ_DEFAULT_FILE = "defaultFile"

    def __init__(self):
        self._files = {}
        self._cached_project = None

    def _key(self, parent_id, file_name):
        return parent_id + '_' +  file_name

    def _root(self):
        if 'root' in self._files:
            return self._files['root']
        return self._root_impl()

    def _app(self):
        app_id = self._find_file(self._root(), self._SKULPT_GL_APP_DIR)
        if app_id is None:
            app_id = self._create_folder(self._root(), self._SKULPT_GL_APP_DIR)
        return app_id

    # Find the first file (id) matching [title] in a folder.  Return None if
    # not found.
    def _find_file(self, folder_id, title):
        key = self._key(folder_id, title)
        if key in self._files:
            return self._files[key]
        return self._find_file_impl(folder_id, title)

    def _create_folder(self, parent_id, folder_name):
        key = self._key(parent_id, folder_name)
        res = self._files[key] =\
            self._create_folder_impl(parent_id, folder_name)
        return res

    def _create_project(self, proj_name):
        proj_folder_id = self._create_folder(self._app(), proj_name)

        with open('./sample/default/' + self._MAIN_PY) as main_py:
            self._update_text_file_impl(proj_folder_id, self._MAIN_PY,
                                       main_py.read())
        proj_json = {
            self._PROJ_NAME: proj_name,
            self._PROJ_SRC : [self._MAIN_PY],
            self._PROJ_DEFAULT_FILE: 0
        }
        self._update_text_file_impl(proj_folder_id, self._PROJ_JSON,
                                   json.dumps(proj_json))
        return proj_folder_id

    def _find_project(self, proj_name, create=False):
        proj_folder_id = self._find_file(self._app(), proj_name)
        if proj_folder_id is None and create:
            return self._create_project(proj_name)
        return proj_folder_id

    def _read_solution(self):
        solution_file_id = self._find_file(self._app(), self._SOLUTION_JSON)
        if solution_file_id is None:
            with open('./sample/' + self._SOLUTION_JSON, 'r') as solution_json:
                solution = json.loads(solution_json.read())
                print solution
                self._update_text_file_impl(self._app(), self._SOLUTION_JSON,
                                            json.dumps(solution))
                return solution
        return json.loads(self._read_text_file_impl(solution_file_id))

    def _project(self):
        if self._cached_project is not None:
            return self._cached_project
        print self._read_solution()
        self._cached_project = self._read_solution()['project']
        return self._cached_project

    def read_file(self, fname):
        print "read file: " + fname
        proj_id = self._find_project(self._project())
        if proj_id is None:
            return None
        file_id = self._find_file(proj_id, fname)
        if file_id is None:
            return None
        return self._read_text_file_impl(file_id)

    def write_file(self, fname, text):
        proj_id = self._find_project(self._project())
        if proj_id is None:
            return False
        self._update_text_file_impl(proj_id, fname, text)
        return True

    def rename_file(self, old_name, new_name):
        proj_id = self._find_project(self._project())
        if proj_id is None:
            return False
        res = self._rename_file_impl(proj_id, old_name, new_name)
        if res is not None:
            return True
        return False

    def delete_file(self, file_name):
        proj_id = self._find_project(self._project())
        if proj_id is None:
            return False
        res = self._delete_file_impl(proj_id, file_name)
        if res is not None:
            return True
        return False

    def update_project(self, proj):
        print "updating project"
        print proj
        changed = False
        oldproj = json.loads(self.project_metadata());

        keys = [self._PROJ_NAME, self._PROJ_SRC, self._PROJ_DEFAULT_FILE]
        for key in keys:
            if key in proj and oldproj[key] != proj[key]:
                oldproj[key] = proj[key]
                changed = True

        if changed:
            proj_id = self._find_project(self._project(), create=False)
            if proj_id is None:
                return
            self._update_text_file_impl(
                proj_id, self._PROJ_JSON, json.dumps(oldproj))
            return True

    def project_metadata(self, create_if_not_found=False):
        proj_id = self._find_project(
            self._project(), create=create_if_not_found)
        if proj_id is None:
            return None
        proj_file_id = self._find_file(proj_id, self._PROJ_JSON)
        if proj_file_id is None:
            return None
        return self._read_text_file_impl(proj_file_id)

    @abstractmethod
    def _root_impl(self): pass

    @abstractmethod
    def _find_file_impl(self, folder_id, title): pass

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
        self.project_metadata(create_if_not_found=True)

    def _root_impl(self):
        self._files['root'] =\
            self.__drive.about().get().execute()['rootFolderId']
        return self._files['root']

    def _find_file_impl(self, folder_id, title):
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
        file_id = self._find_file(parent_id, file_name)

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
        file_id = self._find_file(parent_id, old_name)
        if file_id is None:
            return None
        tbody = self.__drive.files().get(fileId=file_id).execute()
        tbody['title'] = new_name
        self.__drive.files().update(fileId=file_id, body=tbody).execute()
        return file_id

    def _delete_file_impl(self, parent_id, file_name):
        file_id = self._find_file(parent_id, file_name)
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
        # The root directory must exist
        assert os.access(root_dir, os.F_OK)
        self.project_metadata(create_if_not_found=True)

    def _write_key(self, parent_path, file_name):
        key = self._key(parent_path, file_name)
        self._files[key] = parent_path + "/" + file_name
        return self._files[key]

    def _remove_key(self, parent_path, file_name):
        self._files.pop(self._key(parent_path, file_name), None)

    def _root_impl(self):
        self._files['root'] = self.__root_dir
        return self._files['root']

    def _find_file_impl(self, parent_path, title):
        if parent_path is None or not title in os.listdir(parent_path):
            return None
        return self._write_key(parent_path, title)

    def _create_folder_impl(self, parent_path, folder_name):
        if self.__read_only: return None

        path = parent_path + "/" + folder_name
        if os.access(path, os.F_OK):
            return
        os.mkdir(path)
        return self._write_key(parent_path, folder_name)

    def _update_text_file_impl(self, parent_path, file_name, text):
        if self.__read_only: return None

        path = parent_path + "/" + file_name
        if not os.access(path, os.F_OK):
            self._write_key(parent_path, file_name)
        with open(path, "w") as fout:
            fout.write(text)
        return path

    def _rename_file_impl(self, parent_path, old_name, new_name):
        if self.__read_only: return None

        old_path = self._find_file(parent_path, old_name)
        if old_path is None:
            return None
        new_path = parent_path + "/" + new_name
        os.rename(old_path, new_path)
        self._remove_key(parent_path, old_name)
        return self._write_key(parent_path, new_name)

    def _delete_file_impl(self, parent_path, file_name):
        if self.__read_only: return None

        file_path = self._find_file(parent_path, file_name)
        if file_path is None:
            return False
        os.remove(file_path)
        self._remove_key(parent_path, file_name)
        return True

    def _read_text_file_impl(self, file_path):
        if not os.access(file_path, os.F_OK):
            return None
        with open(file_path, "r") as f:
            return f.read()
