# widget.py

from webgl.three import mat4, vec3, arrayf, arrayi, quat, euler
from math import *

POINT_WIDGET_RANGE = .25
INF = float('Inf')

def isinf(x): return x == INF

class Ray:
  def __init__(self, pt, dir):
    self._pt = pt
    self._dir = dir

  def pt(self):
    return self._pt

  def dir(self):
    return self._dir

  def at(self, t):
    return self._dir.clone().multiplyScalar(t).add(self._pt)

  def closest_pt_to_ray(self, ray):
    n = self._dir.clone().cross(ray._dir).normalize()
    v = ray._pt.clone().sub(self._pt)
    y = n.dot(v)
    rpt = v.copy(ray._pt)
    nr2pt = rpt.add(n.clone().multiplyScalar(-y)).sub(self._pt)
    pxdir = self._dir
    pydir = n.cross(pxdir).normalize()
    q2px, q2py = nr2pt.dot(pxdir), nr2pt.dot(pydir)
    q2dirx, q2diry = ray._dir.dot(pxdir), ray._dir.dot(pydir)
    return q2px + (-q2py / q2diry) * q2dirx

  def dist_to_ray(self, ray):
    v12 = self._dir.clone().cross(ray._dir).normalize()
    p21 = ray._pt.clone().sub(self._pt)
    num = abs(p21.dot(v12))
    denom = v12.len()
    if denom == 0:
      tt = p21.dot(self._dir)
      return p21.lengthSq() - (tt * tt) / (self._r1.lengthSq())
    return num / denom

  def dist_to_point(self, p):
    w = p.clone().sub(self._pt)
    y = w.dot(self._dir)
    h2 = w.lengthSq()
    return sqrt(h2 - y * y)

class PointWidget:
  FAIL = -1
  XAXIS = 0
  YAXIS = 1
  ZAXIS = 2
  
  def __init__(self, point):
    self._p = point
    self._dir = [
      Ray(point, vec3(1, 0, 0)),
      Ray(point, vec3(0, 1, 0)),
      Ray(point, vec3(0, 0, 1))]

  def axis(self, d):
    if d < 0:
      return None
    return self._dir[d]
  
  def intersect(self, ray):
    dx = self._dir[0].dist_to_ray(ray)
    dy = self._dir[1].dist_to_ray(ray)
    dz = self._dir[2].dist_to_ray(ray)

    ex = self._dir[0].closest_pt_to_ray(ray)
    ey = self._dir[1].closest_pt_to_ray(ray)
    ez = self._dir[2].closest_pt_to_ray(ray)

    tol = POINT_WIDGET_RANGE

    if ex < 0 or ex > tol: dx = tol + 1
    if ey < 0 or ey > tol: dy = tol + 1
    if ez < 0 or ez > tol: dz = tol + 1
    
    tol = tol / 2

    if dx > tol and dy > tol and dz > tol:
      return PointWidget.FAIL

    if dx < dy and dx < dz:
      return PointWidget.XAXIS
    elif dy < dz:
      return PointWidget.YAXIS
    return PointWidget.ZAXIS

def plane_ray_intersect(p, n, ray):
  dist = n.dot(p.clone().sub(ray.pt()))
  denom = n.dot(ray.dir())
  if denom == 0:
    return INF
  return dist / denom

def tri_normal(a, b, c):
  v0 = vec3().subVectors(b, a)
  v1 = vec3().subVectors(c, a)
  return v0.cross(v1).normalize()

class Quad:
  def __init__(self, a, b, c, d):
    self._pts = [a, b, c, d]

  def ray_intersect(self, ray):
    pts = self._pts  # just to simplify the code
    plen = len(pts)
    v0, v1 = vec3(), vec3()
    for i in range(0, plen, 2):
      a, b, c = pts[i], pts[(i + 1) % plen], pts[(i + 2) % plen]
      pn = tri_normal(a, b, c)
      t = plane_ray_intersect(a, pn, ray)
      if isinf(t):
        continue

      ipt = ray.at(t)
      if tri_normal(ipt, a, b).dot(pn) <= 0 or\
        tri_normal(ipt, b, c).dot(pn) <= 0 or\
        tri_normal(ipt, c, a).dot(pn) <= 0:
        continue
      return t
    return INF