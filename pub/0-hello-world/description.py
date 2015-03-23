from md import *

kd("""

# Hello World #
This is a simple program, intended to be a simple tutorial of *brpy*.

### Sources and Blocks ###
The brpy interface is divided into *projects*. For example, this is the 
'hello-world' project. If you click on **hello-world** at the top, you'll see a few
other examples under the *other projects* divider.

Each *project* is divided into *blocks*, where each block contains several source
files. For example, this block is named **hello-block**, and it contains the source 
file **main.py**

### Evaluation ###
When a source file is changed, the left side of the editor will turn pink. You can
evaluate the changes by pressing the combination *shift+enter*. As an exercise, you
can try changing the content of this file and try reevaluating.

### Saving the source ###
The source is saved on every evaluation.  Even if your evaluation produced error,
the file is still saved. So just use the combination *shift-enter* to save.

### Output ###

The output of brpy can be one of several forms. 
- 
~~~~
print('hello world')
~~~~
will write the string `'hello world'` into the *console*, which can be found at the
bottom left-hand side. Try evaluating the *test* block below.
- The space to the left of the editor is the *content* area. It contains special
  output components created with python code. There are currently two components
  available: *text* and *canvas*.  The *text* content created with the `md.kd(str)` 
  method where `str` is a [kramdown](http://kramdown.gettalong.org/)-style string.
  It is also possible to use `md.kd` write TeX-style outputs. Please see the
  *katex* project (above) for more information.
- The *canvas* content will be covered in other example projects (see **kitten**).

""") 

