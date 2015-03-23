# brpy #
brpy (pronounced "burpy") is a browser-side interactive python client that stresses edit-as-you-go rapid-prototyping. The long term goal of the project is to provide a [Mathematica](http://www.wolfram.com/mathematica/)-like environment where applied math enthusiasts and engineers can express their ideas and collaborate on projects.

brpy is built on a fork/branch of [skulpt](https://github.com/skulpt/skulpt).

## Outline ##
This project is roughly divided into three parts:

1. [Modification to skulpt](https://github.com/poweif/skulpt)
   - Added a few modules (webgl, [threejs](http://threejs.org/) math)
   - Patched missing language feature (inheritance)
   - Associated dom elements to python-code evaluation
   - Allow for [KaTeX](https://github.com/Khan/KaTeX) and [kramdown](http://kramdown.gettalong.org/)

2. Server-side
   - [Tornado](http://www.tornadoweb.org/en/stable/)
   - Cache-level file-saving
     - 1st level is [mongoDB](http://www.mongodb.org) for fast access
     - 2nd level is the user's Google Drive or the server-side disk
     - Allow developers save-to-disk

3. Client-side
   - [react](http://reactjs.org/) as the component framework
   - [Codedmirror](https://codemirror.net/)

## Requirements ##
- python 2.7
  - [pip] (https://pip.pypa.io/en/latest/installing.html)
  - packages:
    [simplejson](https://pypi.python.org/pypi/simplejson),
    [tornado](https://pypi.python.org/pypi/tornado),
    [motor](https://motor.readthedocs.org/en/stable/installation.html),
    [watchdog](http://pythonhosted.org/watchdog/installation.html),
    [Google API Client (python)](https://developers.google.com/api-client-library/python/start/installation)
- [sass](http://www.sass-lang.com)
- [special skulpt fork](https://github.com/poweif/skulpt)

#### Enable save to user's gDrive (strongly recommended) ####
- [mongoDB](http://www.mongodb.org)
- [Google API](https://console.developers.google.com/)

## Installation ##
- For the python packages, you can use `pip` to install them:
```
pip install simplejson google-api-python-client tornado motor watchdog
```
- Clone the forked skulpt (in the brpy root dir.):
```
git clone https://github.com/poweif/skulpt.git
```
- [Sass installation](http://www.sass-lang.com/install)

#### Enable save to user's gDrive ####
- [mongoDB installation](http://docs.mongodb.org/manual/installation/)
- Google API
  - Go to the [Google API console](https://console.developers.google.com/project)
  - Create a new project, give it a name
  - After you've selected the project, (on the left-hand side) go to `API & auth` -> `APIs`
  - Make sure the following APIs are enabled:
    - Drive API
    - Drive SDK
  - Go to `API & auth` -> `Credentials` -> `Create Client ID`
    - Choose 'Service account` and `JSON key`
    - Click `Create Client ID`
    - `Download JSON` for the Client ID you just created
  - Rename the client ID file to `client_secret.json`
  - Move `client_secret.json` to `./tools/files/`

## Running the server ##
- Run script in `skulpt` to generate skulpt javascript library. If you're developing the forked skulpt, then `watch.py` is useful as it will watch for changes and update the resulting lib. Otherwise, just run it once and stop it with `Ctrl-C`.
```
python ./skulpt/tmp/watch.py ./js
```
- Run sass to generate css files. This can also be terminated with `Ctrl-C` if you will not be changing the sass files.
```
./tool/sass
```

- Make sure the Google API Client ID file is present as `./tools/files/client_secret.json`

- Run the server (terminate with `Ctrl-C`)
```
python tools/server/tornado_server.py
```
- Open browser to `http://localhost:8124`
