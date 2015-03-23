# brpy #
brpy (pronounced "burpy") is a browser-side interactive python client that stresses edit-as-you-go rapid-prototyping. The long term goal of the project is to provide a [mathematica](http://www.wolfram.com/mathematica/)-like environment that will enable applied math enthusiasts and engineers to express their ideas and collaborate on projects.

brpy is built on a fork/branch of [skulpt](https://github.com/skulpt/skulpt).

## Outline ##
This project is roughly divided into three parts:

1. Modification to skulpt
   - Added a few modules (webgl, [threejs](http://threejs.org/) math)
   - Patched missing language feature (inheritance)
   - Associated dom elements to python-code evaluation
   - Allow for [KaTeX](https://github.com/Khan/KaTeX) and [kramdown](http://kramdown.gettalong.org/)

2. Server-side
   - [Tornado](http://www.tornadoweb.org/en/stable/)
   - Cache-level file-saving
     - 1st level is [mongoDB](http://www.mongodb.org) for fast access
     - 2nd level is the user's Google Drive or the server-side disk.
     - Also allow save-to-disk for developers.

3. Client-side
   - [react](http://reactjs.org/) as the basic framework
   - [Codedmirror](https://codemirror.net/)

## Requirements ##
- python 2.7
- [python pip] (https://pip.pypa.io/en/latest/installing.html)
- python packages:
  [simplejson](https://pypi.python.org/pypi/simplejson),
  [Google API Client (python)](https://developers.google.com/api-client-library/python/start/installation),
  [tornado](https://pypi.python.org/pypi/tornado),
  [motor](https://motor.readthedocs.org/en/stable/installation.html),
  [watchdog](http://pythonhosted.org/watchdog/installation.html)
- [sass](http://www.sass-lang.com)
- [special skulpt fork](https://github.com/poweif/skulpt)

#### Save to user's gDrive (strongly recommended) ####
- [mongoDB](http://www.mongodb.org)
- [Google API](https://console.developers.google.com/)

## Installation ##
- For the python packages, you can use `pip` to install them:
  - `pip install simplejson google-api-python-client tornado motor watchdog`
- Clone and run the forked skulpt (in the root project dir.):
  - `git clone https://github.com/poweif/skulpt.git`
- `sass` can be installed by following [these instructions](http://www.sass-lang.com/install).

#### Save to user's gDrive ####
- [mongoDB installation](http://docs.mongodb.org/manual/installation/)
-

## Running the server ##
- Run script in `skulpt` to generate skulpt javascript library
```
cd skulpt
python tmp/watch.py ../js
```
   If you're developing the forked skulpt, then `watch.py` is useful as it will watch for changes and update the resulting lib. Otherwise, just run it once and stop it with `Ctrl-C`.

- Run sass to generate css files:
```
./tool/sass
```
This can also be terminated with `Ctrl-C` if you will not be changing the sass files.

- Make sure the Google API Client file is present as `./tools/files/client_secret.json`

- Run the server
```
python tools/server/tornado_server.py
```
