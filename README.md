# brpy #
brpy (pronounced "burpy") is a browser-side interactive python client that stresses edit-as-you-go rapid-prototyping. The long term goal of the project is to provide a [mathematica](http://www.wolfram.com/mathematica/)-like environment that will enable applied math enthusiasts and engineers to express their ideas and collaborate on projects.

brpy is built on a branch of [skulpt](https://github.com/skulpt/skulpt).

## Outline ##
This project is roughly divided into three parts:

1. Modification to skulpt
   - Added A few modules (webgl, etc)
   - Patched missing language (inheritance)
   - Associated dom elements to python-code evaluation
   - Allow for (Katex)[https://github.com/Khan/KaTeX] and (kramdown)[http://kramdown.gettalong.org/]

2. Server-side
   - Developed cache-level file-saving
   - The first-level is MongoDB for fast access
   - The second-level can be user's Google Drive or the server-side disk.

3. Client-side
   - Used [react](http://reactjs.org/) as the basic framework
   - (Codedmirror)[https://codemirror.net/]

## Requirements ##
- python 2.7
- [python pip] (https://pip.pypa.io/en/latest/installing.html)
- python packages
  - [simplejson](https://pypi.python.org/pypi/simplejson)
  - [Google API Client (python)](https://developers.google.com/api-client-library/python/start/installation)
  - [tornado](https://pypi.python.org/pypi/tornado)
  - [motor](https://motor.readthedocs.org/en/stable/installation.html)
  - [watchdog](http://pythonhosted.org/watchdog/installation.html)
- [sass](http://www.sass-lang.com/install)
- [special skulpt branch](https://github.com/poweif/skulpt)

### Save to user's gDrive (strongly recommended) ###
- [mongodb](http://www.mongodb.org)
- [Create project in Google's API Console](https://console.developers.google.com/)

## Installation ##
For the python packages, you can use `pip` to install them:
```
pip install simplejson google-api-python-client tornado motor watchdog
```

`sass` can be installed by following the website's instructions.

### Save to user's gDrive ###

First step is to run sass:
```
./tool/sass
```
