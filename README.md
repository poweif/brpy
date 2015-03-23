# brpy #
brpy (pronounced "burpy") is a browser-side interactive python client that stresses edit-as-you-go kind of rapid-prototyping. The long term goal of the project is to provide a mathematica-like environment that will enable applied math enthusiasts and engineers to express their ideas and collaborate on projects.

Brpy is built on a branch of [skulpt](https://github.com/skulpt/skulpt).

## Requirements ##
- python 2.7
- [python pip] (https://pip.pypa.io/en/latest/installing.html)
- python packages
  - [simplejson](https://pypi.python.org/pypi/simplejson) 
  - [Google API Client (python)](https://developers.google.com/api-client-library/python/start/installation)
  - [tornado](https://pypi.python.org/pypi/tornado)
  - [motor](https://motor.readthedocs.org/en/stable/installation.html)
- [sass](http://www.sass-lang.com/install)
- [Branched Skulpt](https://github.com/poweif/skulpt)

### To save to user account ###
- [mongodb](http://www.mongodb.org)
- [Create project in Google's API Console](https://console.developers.google.com/)

## Set-up ##
For the python packages, you can use `pip` to install them:
```
pip install simplejson google-api-python-client tornado motor watchdog
```

### To save to user account ###

First step is to run sass:
'''
./tool/sass
'''
