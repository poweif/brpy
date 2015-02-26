from apiclient.discovery import build
from apiclient.http import MediaIoBaseUpload
from apiclient.http import MediaFileUpload
import io
import simplejson as json
import httplib2
import os
import shutil

from abc import ABCMeta, abstractmethod

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
    _PROJ_DEFAULT_FILE = "defaultFile"

    _DEFAULT_BLOCK ="default-block"

    def __init__(self):
        self._files = {}
        self._current_project = None

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
        solution = self.read_solution()
        if proj_name in solution['projects']:
            return None
        solution['projects'].append(proj_name)
        self._update_solution({"projects": solution['projects']})

        proj_folder_id = self._create_folder(self._app(), proj_name)

        with open('./sample/default/' + self._MAIN_PY) as main_py:
            self._update_text_file_impl(proj_folder_id, self._MAIN_PY,
                                       main_py.read())
        proj_json = [{
            self._PROJ_SRC : [self._MAIN_PY],
            self._PROJ_DEFAULT_FILE: 0,
            self._PROJ_BLOCK_NAME: self._DEFAULT_BLOCK
        }]
        self._update_text_file_impl(proj_folder_id, self._PROJ_JSON,
                                   json.dumps(proj_json))
        return proj_folder_id

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

    def _update_solution(self, new_sol):
        solution = self.read_solution()
        for key in new_sol:
            if key in solution:
                solution[key] = new_sol[key]

        self._update_text_file_impl(self._app(), self._SOLUTION_JSON,
                                    json.dumps(solution))

    def _pj(self, proj=None):
        if proj is not None:
            return proj
        return self.get_current_project()

    def get_current_project(self):
        if self._current_project is not None:
            return self._current_project
        self.set_current_project(self.read_solution()['projects'][0])
        return self._current_project

    def set_current_project(self, proj):
        projects = self.read_solution()['projects']
        if not proj in projects:
            return False
        self._current_project = proj
        return True

    def rename_project(self, new_name, old_name=None):
        if old_name is None:
            old_name = self.get_current_project()

        projects = self.read_solution()['projects']
        if not old_name in projects or new_name in projects:
            return False

        self._rename_file_impl(self._app(), old_name, new_name)
        self._update_solution(
            {"projects": [x if x != old_name else new_name for x in projects]})

        if self._current_project == old_name:
            self._current_project = new_name

        return True

    def delete_project(self, name):
        projects = self.read_solution()['projects']
        if not name in projects or len(projects) < 2:
            return False

        self._update_solution({"projects": [x for x in projects if x !=name]})
        self._current_project = None
        self._delete_file_impl(self._app(), name)
        return True

    def read_file(self, fname, proj=None):
        print "read file: " + fname
        proj_id = self._find_project_id(self._pj(proj))
        if proj_id is None:
            return None
        file_id = self._find_file_id(proj_id, fname)
        if file_id is None:
            return None
        return self._read_text_file_impl(file_id)

    def write_file(self, fname, text, proj=None):
        proj_id = self._find_project_id(self._pj(proj))
        if proj_id is None:
            return False
        self._update_text_file_impl(proj_id, fname, text)
        return True

    def rename_file(self, old_name, new_name, proj=None):
        proj_id = self._find_project_id(self._pj(proj))
        if proj_id is None:
            return False
        res = self._rename_file_impl(proj_id, old_name, new_name)
        return res is not None

    def delete_file(self, file_name, proj=None):
        proj_id = self._find_project_id(self._pj(proj))
        if proj_id is None:
            return False
        res = self._delete_file_impl(proj_id, file_name)
        return res is not None

    def update_project(self, new_proj_data, proj=None):
        return True
#        changed = False
#        oldproj = json.loads(self.read_project());

#        for key in [self._PROJ_NAME, self._PROJ_SRC, self._PROJ_DEFAULT_FILE]:
#            if key in proj and oldproj[key] != proj[key]:
#                oldproj[key] = proj[key]
#                changed = True

#        if changed:
#            proj_id = self._find_project_id(self._pj(), create=False)
#            if proj_id is None:
#                return
#            self._update_text_file_impl(
#                proj_id, self._PROJ_JSON, json.dumps(oldproj))
#            return True

    def read_project(self, proj=None, create_if_not_found=False):
        proj_id = self._find_project_id(
            self._pj(proj), create=create_if_not_found)
        if proj_id is None:
            return None
        proj_file_id = self._find_file_id(proj_id, self._PROJ_JSON)
        if proj_file_id is None:
            return None
        return self._read_text_file_impl(proj_file_id)

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
        self.read_project(create_if_not_found=True)

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
        # The root directory must exist
        assert os.access(root_dir, os.F_OK)
        self.read_project(create_if_not_found=True)

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
        if self.__read_only: return None

        path = parent_path + "/" + folder_name
        if os.access(path, os.F_OK):
            return _write_key(parent_path, folder_name)
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

        old_path = self._find_file_id(parent_path, old_name)
        if old_path is None:
            return None
        new_path = parent_path + "/" + new_name
        os.rename(old_path, new_path)
        self._remove_key(parent_path, old_name)
        return self._write_key(parent_path, new_name)

    def _delete_file_impl(self, parent_path, file_name):
        if self.__read_only: return None

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
        with open(file_path, "r") as f:
            return f.read()
