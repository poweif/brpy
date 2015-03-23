# main.py

import webgl
from webgl import glut
from webgl.three import mat4, vec3, vec4, quat

from arcball import ArcBall
from subdivision import MeshGL, QuadMesh, LineMesh,\
  subdivide_catmull_clark, split_quad, sum_points
from widget import POINT_WIDGET_RANGE, PointWidget, Quad, Ray, INF
import shaders

BLACK_COLOR = vec4(0, 0, 0, 1)
RED_COLOR = vec4(.9, .45, .4, 1.0)
GREEN_COLOR = vec4(.4, .9, .45, 1.0)
BLUE_COLOR = vec4(.4, .45, .95, 1.0)
HIGHLIGHT_COLOR = vec4(.95, .95, .5, 1.0)
HIGHLIGHT_COLOR_TR = HIGHLIGHT_COLOR.clone().multiplyScalar(.6)

SELECT_COLOR = vec4(.45, .55, .95, 1.0)
SELECT_COLOR_TR = SELECT_COLOR.clone().multiplyScalar(.6)

MOUSE_MODE_NONE = -1
MOUSE_MODE_ROTATE = 0
MOUSE_MODE_AXIS = 1

_width = _height = 350

_mousedown = False
_prev_rot = quat()
_arcball = ArcBall(_width, _height)

_mats = {}

_phong_prog = None
_frame_prog = None

_ctrl_verts = None
_ctrl_inds = None
_ctrl_quads = None

_mesh_gl = None
_line_mesh_gl = None
_widget_gl = None
_quad_gl = None

_highlight_quad_ind = -1
_select_quad_ind = -1
_select_axis = PointWidget.FAIL

_mouse_drag_mode = MOUSE_MODE_NONE
_zoom = -4.3

_widget = None

def subdivide(group, times=3):
  nvs, nmesh = group
  for _ in range(times):
    nvs, nmesh = subdivide_catmull_clark(nvs, nmesh)  
  return (nvs, nmesh)

def reset_interaction(gl):
  global _highlight_quad_ind, _select_axis,\
    _mouse_drag_mode, _widget, _widget_gl, _quad_gl

  _highlight_quad_ind = -1
  _select_axis = PointWidget.FAIL

  _mouse_drag_mode = MOUSE_MODE_NONE
  _widget = None

  if _widget_gl is not None:
    _widget_gl.clear()

  if _quad_gl is not None:
    _quad_gl.clear()

  _widget_gl = _quad_gl = None

def update_ctrl_mesh(gl, verts, inds):
  global _ctrl_verts, _ctrl_inds, _ctrl_quads, _mesh_gl, _line_mesh_gl
  _ctrl_verts = verts
  _ctrl_inds = inds
  # convenience structure for ray-intersection tests
  _ctrl_quads = [Quad(w[0], w[1], w[2], w[3]) for w in\
                 [[verts[x] for x in y] for y in inds]]

  nvs, ninds = subdivide((verts, inds))
  _mesh_gl = MeshGL(gl, QuadMesh().add_verts(nvs).add_quads(ninds))

  seen_lines = {}
  mesh_lines = []
  for a, b, c, d in inds:
    for i, j in [(a, b), (b, c), (c, d), (d, a)]:
      if (i, j) in seen_lines:
        continue
      seen_lines[(i, j)] = seen_lines[(j, i)] = True
      mesh_lines.append((i, j))

  _line_mesh_gl =\
    MeshGL(gl, LineMesh().add_verts(verts).add_lines(mesh_lines))

  reset_interaction(gl)

def setup(gl):
  global _frame_prog, _phong_prog, _mats

  verts = [
    vec3(-1, -1, -1), vec3( 1, -1, -1), vec3(-1,  1, -1), vec3( 1,  1, -1),
    vec3(-1, -1,  1), vec3( 1, -1,  1), vec3(-1,  1,  1), vec3( 1,  1,  1)
  ]

  inds = [
    (0, 1, 3, 2), (1, 5, 7, 3), (5, 4, 6, 7), (4, 0, 2, 6),
    (2, 3, 7, 6), (4, 5, 1, 0)
  ]
  update_ctrl_mesh(gl, verts=verts, inds=inds)

  _phong_prog = shaders.Program(gl, shaders.PHONG_VS, shaders.PHONG_FS)
  _frame_prog = shaders.Program(gl, shaders.FRAME_VS, shaders.FRAME_FS)

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
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

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

  # draw the control mesh in wireframe
  _frame_prog.use().\
    set_uniform_vec4("_color", BLACK_COLOR).\
    set_uniform_matrices(matrices)
  _line_mesh_gl.draw(vert=_frame_prog.attrib("_pos"))

  if _widget_gl is not None:
    if _select_axis >= 0:
      gl.disable(gl.DEPTH_TEST)      
      render_widget(gl, _frame_prog, matrices)
      gl.enable(gl.DEPTH_TEST)            
    else:
      render_widget(gl, _frame_prog, matrices)

  if _highlight_quad_ind >= 0 and _highlight_quad_ind != _select_quad_ind:
    render_quad(gl, _frame_prog, matrices, ind=_highlight_quad_ind,
                color=HIGHLIGHT_COLOR_TR)

  if _select_quad_ind >= 0:
    if _select_axis >= 0:
      gl.disable(gl.DEPTH_TEST)      
      render_quad(gl, _frame_prog, matrices, ind=_select_quad_ind,
                  color=SELECT_COLOR_TR)
      gl.enable(gl.DEPTH_TEST)            
    else:
      render_quad(gl, _frame_prog, matrices, ind=_select_quad_ind,
                  color=SELECT_COLOR_TR)

def render_quad(gl, prog, matrices, ind, color):
  if _quad_gl is None:
    return

  prog.set_uniform_vec4("_color", color)
  point_attrib = prog.attrib("_pos")
  _quad_gl.attach_vert(vert=point_attrib).attach_ind().\
    only_draw(ind * 6, 6).\
    detach_vert(vert=point_attrib)

def render_widget(gl, prog, matrices):
  if _widget_gl is None:
    return

  gl.lineWidth(5.)
  point_attrib = prog.attrib("_pos")
  _widget_gl.attach_vert(vert=point_attrib).attach_ind()

  cs = {
    PointWidget.XAXIS: RED_COLOR,
    PointWidget.YAXIS: GREEN_COLOR,
    PointWidget.ZAXIS: BLUE_COLOR
  }
  cs[_select_axis] = HIGHLIGHT_COLOR

  prog.set_uniform_vec4("_color", cs[PointWidget.XAXIS])
  _widget_gl.only_draw(0, 2)
  prog.set_uniform_vec4("_color", cs[PointWidget.YAXIS])
  _widget_gl.only_draw(2, 2)
  prog.set_uniform_vec4("_color", cs[PointWidget.ZAXIS])
  _widget_gl.only_draw(4, 2)

  _widget_gl.detach_vert(vert=point_attrib)

  gl.lineWidth(1.)

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

def select_quad(gl, ind):
  global _select_quad_ind, _widget_gl, _widget

  if ind == _select_quad_ind:
    return

  _select_quad_ind = ind

  if _widget_gl is not None:
    _widget_gl.clear()
    _widget_gl = None

  if ind < 0:
    return

  quad_pts = [_ctrl_verts[x] for x in _ctrl_inds[ind]]
  avg = sum_points(quad_pts).multiplyScalar(1. / len(quad_pts))
  vl = POINT_WIDGET_RANGE
  verts = [
    avg,
    vec3(vl, 0, 0).add(avg),
    vec3(0, vl, 0).add(avg),
    vec3(0, 0, vl).add(avg)
  ]
  lines = [(0, 1), (0, 2), (0, 3)]
  _widget_gl = MeshGL(gl, LineMesh().add_verts(verts).add_lines(lines))
  _widget = PointWidget(avg)

  _select_quad_ind = ind

def highlight_quad(gl, ind):
  global _highlight_quad_ind, _quad_gl

  if ind == _highlight_quad_ind:
    return
  _highlight_quad_ind = ind

  if _quad_gl is None:
    quad_mesh = QuadMesh().add_verts(_ctrl_verts).add_quads(_ctrl_inds)
    _quad_gl = MeshGL(gl, quad_mesh)

def move_quad_widget(gl, x, y):
  global _mesh_gl

  mpv_inv = _mats["model_view_proj_inv"]
  ny = _height - y
  ray_start = unproject(x, ny, 0, mpv_inv, _width, _height)
  ray_dir = unproject(x, ny, 1, mpv_inv, _width, _height).sub(ray_start).\
    normalize()
  ray = Ray(ray_start, ray_dir)

  vl = POINT_WIDGET_RANGE
  axis = _widget.axis(_select_axis)
  target_pt = axis.at(axis.closest_pt_to_ray(ray))

  _widget_mesh = _widget_gl.mesh()

  move_vector = target_pt.clone().sub(_widget_mesh.verts()[0])

  _widget_mesh.update_vert(0, target_pt).\
    update_vert(1, vec3(vl, 0, 0).add(target_pt)).\
    update_vert(2, vec3(0, vl, 0).add(target_pt)).\
    update_vert(3, vec3(0, 0, vl).add(target_pt))

  _widget_gl.update_all_verts()

  for qi in _ctrl_inds[_select_quad_ind]:
    nvert = _ctrl_verts[qi].add(move_vector)
    _line_mesh_gl.mesh().update_vert(qi, nvert)
    _line_mesh_gl.update_vert(qi)
    if _quad_gl is not None:
      _quad_gl.mesh().update_vert(qi, nvert)
      _quad_gl.update_vert(qi)

  nvs, nmesh = subdivide((_ctrl_verts, _ctrl_inds), times=2)
  if _mesh_gl is not None:
    _mesh_gl.clear()

  _mesh_gl = MeshGL(gl, QuadMesh().add_verts(nvs).add_quads(nmesh))

def middle_mouse_clicked(gl, down, x, y):
  if not down and _select_quad_ind >= 0 and\
    _highlight_quad_ind == _select_quad_ind:
    nverts, ninds = split_quad(_ctrl_verts, _ctrl_inds, _select_quad_ind)
    update_ctrl_mesh(gl, nverts, ninds)

def right_mouse_clicked(gl, down, x, y):
  global _mouse_drag_mode, _mesh_gl
  if down:
    if _select_axis >= 0:
      _mouse_drag_mode = MOUSE_MODE_AXIS
  else:
    if _mouse_drag_mode == MOUSE_MODE_AXIS:
      nvs, nmesh = subdivide((_ctrl_verts, _ctrl_inds))
      _mesh_gl = MeshGL(gl, QuadMesh().add_verts(nvs).add_quads(nmesh))

    select_quad(gl, _highlight_quad_ind)
    _mouse_drag_mode = MOUSE_MODE_NONE

def left_mouse_clicked(gl, down, x, y):
  global _prev_rot, _mouse_drag_mode
  if down:
    _arcball.click(vec3(x, y, 0))
    _mouse_drag_mode = MOUSE_MODE_ROTATE
  else:
    _prev_rot = _arcball.drag(vec3(x, y, 0)).multiply(_prev_rot)
    update_rot(_prev_rot)
    _mouse_drag_mode = MOUSE_MODE_NONE

def mouse_clicked(gl, button, state, x, y):
  global _mousedown, _zoom

  _mousedown = (state == glut.DOWN)
  if button == glut.LEFT_BUTTON:
    left_mouse_clicked(gl, _mousedown, x, y)
  elif button == glut.RIGHT_BUTTON:
    right_mouse_clicked(gl, _mousedown, x, y)
  elif button == glut.MIDDLE_BUTTON:
    middle_mouse_clicked(gl, _mousedown, x, y)
  elif button == glut.WHEEL_UP_BUTTON:
    _zoom += .1
    update_zoom()
    update_rot(_prev_rot)
  elif button == glut.WHEEL_DOWN_BUTTON:
    _zoom -= .1
    update_zoom()
    update_rot(_prev_rot)

  render(gl)

def unproject(winx, winy, winz, mvp_inv, width, height):
  ivec = vec4((winx * 1. / width) * 2 - 1, 
              (winy * 1. / height) * 2 - 1,
              winz * 2 - 1, 
              1.0).applyMatrix4(mvp_inv)
  out = ivec.multiplyScalar(1 / ivec.w())
  return vec3(out.x(), out.y(), out.z())

def mouse_drag(gl, x, y):
  if _mouse_drag_mode == MOUSE_MODE_ROTATE:
    update_rot(_arcball.drag(vec3(x, y, 0)).multiply(_prev_rot))
  elif _mouse_drag_mode == MOUSE_MODE_AXIS:
    move_quad_widget(gl, x, y)
  render(gl)

def mouse_move(gl, x, y):
  global _select_axis

  mpv_inv = _mats["model_view_proj_inv"]
  ny = _height - y
  pt_start = unproject(x, ny, 0, mpv_inv, _width, _height)
  pt_end = unproject(x, ny, 1, mpv_inv, _width, _height)
  ray = Ray(pt_start, pt_end.sub(pt_start).normalize())

  if _widget:
    _select_axis = _widget.intersect(ray)

  best_dist, best_ind = INF, -1
  for i, f in enumerate(_ctrl_quads):
    t = f.ray_intersect(ray)
    if t < best_dist:
      best_dist, best_ind = t, i

  highlight_quad(gl, best_ind)
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
  glut.passiveMotionFunc(mouse_move)
  glut.reshapeFunc(reshape)
  print "done hello!"

main()