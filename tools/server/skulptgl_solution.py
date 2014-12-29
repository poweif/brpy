from apiclient.discovery import build
from apiclient.http import MediaIoBaseUpload
import io
import simplejson as json
import httplib2

SOLUTION_JSON = 'solution.json'
DEFAULT_PROJ = 'default'
PROJ_JSON = 'project.json'
MAIN_PY = 'main.py'
SKULPT_APP_DIR = 'skulptgl_app_data'
JSON_MIME = "application/json"
TEXT_MIME = "text/plain"

def build_drive_service(credentials):
    return build(
        serviceName = 'drive', version='v2',
        http = credentials.authorize(httplib2.Http()))

class SkulptglSolution():
    """Encapsulation of a Skulptgl Solution"""
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
        app_id = self.__find_file(self.__root(), SKULPT_APP_DIR)
        if app_id is None:
            app_id = self.__create_folder(self.__root(), SKULPT_APP_DIR)
        return app_id

    # Find the first file (id) matching [title] in a folder.  Return None if not found.
    def __find_file(self, folder_id, title):
        key = self.__key(folder_id, title)
        if key in self.__files:
            return self.__files[key]

        param = {"q": "title = '%s' and trashed = false" % title}
        items = self.__drive.children().list(
            folderId=folder_id,
            **param).execute()['items']
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
        if type(text) is str:
            text = unicode(text)
        output = io.StringIO(text)
        mime = TEXT_MIME

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

    def __read_text_file(self, file_id):
        tfile = self.__drive.files().get(fileId=file_id).execute()
        download_url = tfile['downloadUrl']
        print(download_url)
        if download_url is None:
            return None

        resp, content = self.__drive._http.request(download_url)
        if resp.status == 200:
            #print 'Status: %s' % resp
            return content

        print 'An error occurred: %s' % resp
        return None

    def __create_project(self, proj_name):
        proj_folder_id = self.__create_folder(self.__app(), proj_name)

        main_py = open('./simple/main.py')
        self.__update_text_file(
            proj_folder_id, MAIN_PY, main_py.read())
        main_py.close()

        proj_json = {
            'name': proj_name,
            'src' : [MAIN_PY],
            'default_file': 0}
        self.__update_text_file(
            proj_folder_id, PROJ_JSON, json.dumps(proj_json))

        return proj_folder_id

    def __find_project(self, proj_name, create=False):
        proj_folder_id = self.__find_file(self.__app(), proj_name)
        if proj_folder_id is None and create:
            return self.__create_project(proj_name)
        return proj_folder_id

    def __read_solution(self):
        solution_file_id = self.__find_file(self.__app(), SOLUTION_JSON)
        solution = {}

        if solution_file_id is None:
            solution = {'project': DEFAULT_PROJ}
            self.__update_text_file(
                self.__app(), SOLUTION_JSON, json.dumps(solution))
        else:
            solution = json.loads(self.__read_text_file(solution_file_id))
        return solution

    def __project(self):
        if self.__cached_project is not None:
            return self.__cached_project
        self.__cached_project = self.__read_solution()['project']
        return self.__cached_project

    def project_metadata(self, create_if_not_found=False):
        proj_id = self.__find_project(
            self.__project(), create=create_if_not_found)
        if proj_id is None:
            return None
        proj_file_id = self.__find_file(proj_id, PROJ_JSON)
        if proj_file_id is None:
            return None
        return self.__read_text_file(proj_file_id)

    def read_file(self, fname):
        proj_id = self.__find_project(self.__project())
        if proj_id is None:
            return None
        file_id = self.__find_file(proj_id, fname)
        if file_id is None:
            return None
        return self.__read_text_file(file_id)

    def write_file(self, fname, text):
        proj_id = self.__find_project(self.__project())
        if proj_id is None:
            return None
        self.__update_text_file(proj_id, fname, text)
        return True

    # TODO: need to implement delete file
    def delete_file(self, fname):
        return 

        
