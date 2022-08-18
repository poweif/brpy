from md import *

kd("""

# Hello World #
brpy is a browser-based interactive python interpreter that emphasizes edit-as-you-go, rapid prototyping. The long term goal of the project is to provide a [Mathematica](http://www.wolfram.com/mathematica/)-like environment where students, teacher\
s, math enthusiasts and engineers can express their ideas and collaborate on projects.

With this platform, it should be simple to create standalone lessons, learning modules, and algorithm walkthrough/demos. brpy currently provides markdown and latex-style output and glut-based WebGL hooks. (In the future, we might provide built-in d3 support an\
d canvas2D support.)

brpy is built on a fork/branch of [skulpt](https://github.com/skulpt/skulpt).

### General ###
The brpy interface is divided into *projects*. For example, this is the
'0-hello-world' project. If you click on **0-hello-world** at the top, you'll see other sample projects under the *other projects* divider.

#### Blocks ####
Each *project* is divided into *blocks*, where each block contains several source
files (or links to other blocks). For example, this block is named **hello-block**, and it contains the source file **description.py**.

Each block has two modes: *edit* and *display*. In *edit*-mode, we can modify source files, and if the sources correspond to forms of output (markdown or webgl), then the left-hand half of edit-mode will show the output. The *display*-mode will only show the outputs of the block (source files are hidden). You can switch from *edit* to *display* by clicking on the block name and choosing *display mode*. To switch from *display* to *edit*, click on the pen icon at the top right-hand corner of the block.

#### Linking to a block ####
A block can be *imported* into another block. Being able to import block allows us to separate source files into logical blocks.  For example, you might want to group a series of python source files on 2D drawing(corresponding to modules) into a block. This 2D drawing block can then be imported into any subsequent blocks that requre 2D drawing.  Circular dependency is avoided by a check that runs at the moment of import.

#### Evaluation and Saving ####
When a source file is changed, the left side of the editor will turn pink. You can evaluate the changes by pressing the combination **`shift+enter`**. As an exercise, you can try changing the content of this file and try reevaluating.

The source is saved on every evaluation.  Even if your evaluation produced error,
the file is still saved. So just use the combination **`shift+enter`** to save.

#### Working with your Google Drive account ####
The work of the public user (where top-right area says **login**) will not be saved anywhere and will disappear on a page refresh.  If you'd like to save your work, you will need to login.  brpy currently provides saving your work onto your Google Drive space, and therefore, the login will also be asking for such permission.

You may wish to import sample projects into your own account for start. You can do that by choosing the "copy to user" option in *login*.

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
  **1-math-symbols** project (above) for more information.
- The *canvas (WebGL)* content will be covered in the **3-kitten** project.

""")
