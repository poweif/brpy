# main.py

import webgl
import shaders

from webgl import glut
from webgl.three import mat4, vec3, vec4, quat

from arcball import ArcBall
from mesh import MeshGL, TriMesh
from kitten_data import *

MOUSE_MODE_NONE = -1
MOUSE_MODE_ROTATE = 0
MOUSE_MODE_AXIS = 1

_width = _height = 350

_mousedown = False
_prev_rot = quat()
_arcball = ArcBall(_width, _height)

_mats = {}

_phong_prog = None
_mesh_gl = None

_mouse_drag_mode = MOUSE_MODE_NONE
_zoom = -1.8

def setup(gl):
  global _phong_prog, _mats, _mesh_gl

  _phong_prog = shaders.Program(gl, shaders.PHONG_VS, shaders.PHONG_FS)

  _mats["model"] = mat4()
  _mats["model_inv_tr"] = mat4()
  _mats["view"] = view_mat = mat4().setPosition(vec3(0, 0, _zoom))
  _mats["proj"] = proj_mat = mat4().makePerspective(45, 1, .1, 30)
  _mats["view_inv"] = view_mat.clone().inverse()
  _mats["view_proj"] = view_proj_mat = proj_mat.clone().multiply(view_mat)
  _mats["view_proj_inv"] = _mats["view_proj"].clone().inverse()
  _mats["model_view_proj"] = view_proj_mat.clone()
  _mats["model_view_proj_inv"] = view_proj_mat.clone().inverse()

  gl.viewport(0, 0, _width, _height)
  gl.disable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)

  tri_mesh = TriMesh()
  for i in range(0, len(CAT_VS), 3):
    tri_mesh.add_vert(vec3(CAT_VS[i], CAT_VS[i + 1], CAT_VS[i + 2]))
  for i in range(0, len(CAT_INDS), 3):
    tri_mesh.add_tri(CAT_INDS[i], CAT_INDS[i + 2], CAT_INDS[i + 1])
  _mesh_gl = MeshGL(gl, tri_mesh)

def render(gl):
  gl.clearColor(1.0, 1.0, 1.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  matrices = {
    "_model": _mats["model"],
    "_model_inv_tr": _mats["model_inv_tr"],
    "_model_view_proj": _mats["model_view_proj"],
    "_view_inv": _mats["view_inv"]
  }

  # draw the subdivided mesh
  _phong_prog.use().set_uniform_matrices(matrices)
  _mesh_gl.draw(
    vert=_phong_prog.attrib("_pos"), normal=_phong_prog.attrib("_normal"))

def update_rot(rot):
  model_mat = _mats["model"].makeRotationFromQuaternion(rot)
  _mats["model_view_proj"].multiplyMatrices(_mats["view_proj"], model_mat)

  model_mat_inv = model_mat.clone().inverse()  
  _mats["model_view_proj_inv"].\
    multiplyMatrices(model_mat_inv, _mats["view_proj_inv"])
  _mats["model_inv_tr"] = model_mat_inv.transpose()

def update_zoom():
  proj_mat = _mats["proj"]
  _mats["view"] = view_mat = mat4().setPosition(vec3(0, 0, _zoom))
  _mats["view_inv"] = view_mat.clone().inverse()
  _mats["view_proj"] = view_proj_mat = proj_mat.clone().multiply(view_mat)
  _mats["view_proj_inv"] = _mats["view_proj"].clone().inverse()

def left_mouse_clicked(gl, down, x, y):
  global _prev_rot, _mouse_drag_mode
  if down:
    _arcball.click(vec3(x, y, 0))
  else:
    _prev_rot = _arcball.drag(vec3(x, y, 0)).multiply(_prev_rot)
    update_rot(_prev_rot)

def mouse_clicked(gl, button, state, x, y):
  global _mousedown, _zoom

  _mousedown = (state == glut.DOWN)
  if button == glut.LEFT_BUTTON:
    left_mouse_clicked(gl, _mousedown, x, y)
  elif button == glut.WHEEL_UP_BUTTON:
    _zoom += .1
    update_zoom()
    update_rot(_prev_rot)
  elif button == glut.WHEEL_DOWN_BUTTON:
    _zoom -= .1
    update_zoom()
    update_rot(_prev_rot)

  render(gl)

def mouse_drag(gl, x, y):
  update_rot(_arcball.drag(vec3(x, y, 0)).multiply(_prev_rot))
  render(gl)
    
def reshape(gl, width, height):
  global _arcball, _width, _height
  _width, _height = width, height
  _arcball = ArcBall(width, height)
  gl.viewport(0, 0, width, height)
  render(gl)

def main():
  gl, glut = webgl.glutCreateWindow(_width, _height)
  setup(gl)
  render(gl)
  glut.mouseFunc(mouse_clicked)
  glut.motionFunc(mouse_drag)
  glut.reshapeFunc(reshape)

main()