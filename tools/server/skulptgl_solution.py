from apiclient.discovery import build
from apiclient.http import MediaIoBaseUpload
from apiclient.http import MediaFileUpload
import io
import simplejson as json
import httplib2

def build_drive_service(credentials):
    return build(
        serviceName = 'drive', version='v2',
        http = credentials.authorize(httplib2.Http()))

class SkulptglSolution():
    """Encapsulation of a Skulptgl Solution"""

    _SOLUTION_JSON = 'solution.json'
    _DEFAULT_PROJ = 'default'
    _PROJ_JSON = 'project.json'
    _MAIN_PY = 'main.py'
    _SKULPT_APP_DIR = 'skulptgl_app_data'
    _TEXT_MIME = "text/plain"

    _PROJ_NAME = "name"
    _PROJ_SRC = "src"
    _PROJ_DEFAULT_FILE = "defaultFile"

    def __init__(self, cred):
        self.__cred = cred
        self.__drive = build_drive_service(cred)
        self.__files = {}
        self.__cached_project = None

        # Initialize the project if not found
        self.project_metadata(create_if_not_found=True)

    def __key(self, parent_id, file_name):
        return parent_id + file_name

    def __root(self):
        if 'root' in self.__files:
            return self.__files['root']
        self.__files['root'] =\
            self.__drive.about().get().execute()['rootFolderId']
        return self.__files['root']

    def __app(self):
        app_id = self.__find_file(self.__root(), self._SKULPT_APP_DIR)
        if app_id is None:
            app_id = self.__create_folder(self.__root(), self._SKULPT_APP_DIR)
        return app_id

    # Find the first file (id) matching [title] in a folder.  Return None if
    # not found.
    def __find_file(self, folder_id, title):
        key = self.__key(folder_id, title)
        if key in self.__files:
            return self.__files[key]

        param = {"q": "title = '%s' and trashed = false" % title}
        itemsp = self.__drive.children().list(
            folderId=folder_id,
            **param).execute()
        items = itemsp['items']
        if len(items) < 1:
            self.__files[key] = None
            return None
        self.__files[key] = items[0]['id']
        return self.__files[key]

    def __create_folder(self, parent_id, folder_name):
        res = self.__drive.files().insert(
            body = {
                'title': folder_name,
                'parents': [{"id": parent_id}],
                'mimeType': "application/vnd.google-apps.folder"
            }).execute()
        self.__files[self.__key(parent_id, folder_name)] = res['id']
        return res['id']

    def __update_text_file(self, parent_id, file_name, text):
        print "updating: " + file_name

        if type(text) is str:
            text = unicode(text)
        output = io.StringIO(text)
        mime = self._TEXT_MIME
        file_id = self.__find_file(parent_id, file_name)

        if file_id is None:
            dfile = self.__drive.files().insert(
                media_body=MediaIoBaseUpload(output, mime),
                body={
                    'title': file_name,
                    'parents': [{"id": parent_id}],
                    'mimeType': mime}).execute()
            output.close()
            self.__files[self.__key(parent_id, file_name)] = dfile['id']
            return dfile['id']

        self.__drive.files().update(
            fileId=file_id,
            media_body=MediaIoBaseUpload(output, mime)).execute()
        output.close()
        return file_id

    def __rename_file(self, parent_id, old_name, new_name):
        file_id = self.__find_file(parent_id, old_name)
        if file_id is None:
            return None
        tbody = self.__drive.files().get(fileId=file_id).execute()
        tbody['title'] = new_name
        self.__drive.files().update(fileId=file_id, body=tbody).execute()
        return file_id

    def __delete_file(self, parent_id, file_name):
        file_id = self.__find_file(parent_id, file_name)
        if file_id is None:
            return None
        self.__drive.files().trash(fileId=file_id).execute()
        return file_id

    def __read_text_file(self, file_id):
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

    def __create_project(self, proj_name):
        proj_folder_id = self.__create_folder(self.__app(), proj_name)

        main_py = open('./simple/main.py')
        self.__update_text_file(
            proj_folder_id, self._MAIN_PY, main_py.read())
        main_py.close()

        proj_json = {
            self._PROJ_NAME: proj_name,
            self._PROJ_SRC : [self._MAIN_PY],
            self._PROJ_DEFAULT_FILE: 0
        }

        self.__update_text_file(
            proj_folder_id, self._PROJ_JSON, json.dumps(proj_json))

        return proj_folder_id

    def __find_project(self, proj_name, create=False):
        proj_folder_id = self.__find_file(self.__app(), proj_name)
        if proj_folder_id is None and create:
            return self.__create_project(proj_name)
        return proj_folder_id

    def __read_solution(self):
        solution_file_id = self.__find_file(self.__app(), self._SOLUTION_JSON)
        solution = {}

        if solution_file_id is None:
            solution = {'project': self._DEFAULT_PROJ}
            self.__update_text_file(
                self.__app(), self._SOLUTION_JSON, json.dumps(solution))
        else:
            solution = json.loads(self.__read_text_file(solution_file_id))
        return solution

    def __project(self):
        if self.__cached_project is not None:
            return self.__cached_project
        self.__cached_project = self.__read_solution()['project']
        return self.__cached_project

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
            proj_id = self.__find_project(self.__project(), create=False)
            if proj_id is None:
                return
            self.__update_text_file(
                proj_id, self._PROJ_JSON, json.dumps(oldproj))
            return True

    def project_metadata(self, create_if_not_found=False):
        proj_id = self.__find_project(
            self.__project(), create=create_if_not_found)
        if proj_id is None:
            return None
        proj_file_id = self.__find_file(proj_id, self._PROJ_JSON)
        if proj_file_id is None:
            return None
        return self.__read_text_file(proj_file_id)

    def read_file(self, fname):
        print "read file: " + fname
        proj_id = self.__find_project(self.__project())
        if proj_id is None:
            return None

        print "read file 1: " + fname
        file_id = self.__find_file(proj_id, fname)
        if file_id is None:
            return None

        print "read file 2: " + fname
        return self.__read_text_file(file_id)

    def write_file(self, fname, text):
        proj_id = self.__find_project(self.__project())
        if proj_id is None:
            return None
        self.__update_text_file(proj_id, fname, text)
        return True

    def rename_file(self, old_name, new_name):
        proj_id = self.__find_project(self.__project())
        if proj_id is None:
            return None
        res = self.__rename_file(proj_id, old_name, new_name)
        if res is not None:
            return True
        return None

    def delete_file(self, file_name):
        proj_id = self.__find_project(self.__project())
        if proj_id is None:
            return None
        res = self.__delete_file(proj_id, file_name)
        if res is not None:
            return True
        return None
