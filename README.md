# brpy #
brpy (pronounced "burpy") is a browser-side interactive python client that stresses edit-as-you-go rapid-prototyping. The long term goal of the project is to provide a (mathematica)[http://www.wolfram.com/mathematica/]-like environment that will enable applied math enthusiasts and engineers to express their ideas and collaborate on projects.

brpy is built on a branch of [skulpt](https://github.com/skulpt/skulpt).

## outline ##
This project is roughly divided into three parts:
1. Modification to skulpt
2. Server-side
3. Client-side

## requirements ##
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

### save to user google drive (strongly recommended) ###
- [mongodb](http://www.mongodb.org)
- [Create project in Google's API Console](https://console.developers.google.com/)

## installation ##
For the python packages, you can use `pip` to install them:
```
pip install simplejson google-api-python-client tornado motor watchdog
```

`sass` can be installed by following the website's instructions.

### save to user Google Drive ###

First step is to run sass:
```
./tool/sass
```
