# subdivision.py

from webgl.three import vec3, arrayf, arrayi

class Mesh:
  ERROR = -1
  POINTS = 0
  TRIANGLES = 1
  LINES = 2
  QUADS = 3

  def __init__(self):
    self._verts = []
    self._flat_verts = None

  def add_vert(self, v):
    self._verts.append(v)
    if self._flat_verts is not None:
      self._flat_verts = None
    return self

  def add_verts(self, vs):
    self._verts.extend(vs)
    if self._flat_verts is not None:
      self._flat_verts = None
    return self

  def update_vert(self, i, v):
    self._verts[i].copy(v)
    if self._flat_verts is not None:
      self._flat_verts.set_vec3(i * 3, v)
    return self

  def verts_array(self):
    if self._flat_verts is None:
      self._update()
    return self._flat_verts

  def verts(self):
    return self._verts

  def _update(self):
    self._flat_verts = arrayf(self._verts)

  def content(self):
    return self.ERROR

class LineMesh(Mesh):
  def __init__(self):
    super(LineMesh, self).__init__()
    self._lines = []
    self._flat_lines = None

  def add_line(self, a, b):
    self._lines.append((a, b))
    if self._flat_lines is not None:
      self._flat_lines = None
    return self

  def add_lines(self, ls):
    self._lines.extend(ls)
    if self._flat_lines is not None:
      self._flat_lines = None
    return self

  def lines_array(self):
    if self._flat_lines is None:
      self._update()
    return self._flat_lines

  def _update(self):
    self._flat_lines = arrayi(self._lines)
    super(LineMesh, self)._update()

  def content(self):
    return self.LINES

class PointMesh(Mesh):
  def __init__(self):
    super(PointMesh, self).__init__()
    self._points = []
    self._flat_points = None

  def add_point(self, a):
    self._points.append(a)
    if self._flat_points is not None:
      self._flat_points = None
    return self

  def points_array(self):
    if self._flat_points is None:
      self._update()
    return self._flat_points

  def _update(self):
    self._flat_points = arrayi(self._points)
    super(PointMesh, self)._update()

  def content(self):
    return self.POINTS

class PolyMesh(Mesh):
  def __init__(self):
    super(PolyMesh, self).__init__()
    self._tris = []
    self._flat_norms = None
    self._flat_tris = None    

  def add_tri(self, a, b, c):
    self._tris.append((a, b, c))
    if self._flat_tris is not None or self._flat_norms is not None:
      self._flat_tris = None
      self._flat_norms = None
    return self

  def tris_array(self):
    if self._flat_tris is None:
      self._update()
    return self._flat_tris

  def tris(self):
    return self._tris

  def norms_array(self):
    if self._flat_norms is None:
      self._update()
    return self._flat_norms

  def __build_normals(self):
    vs = self._verts
    norms = [vec3() for _ in range(len(vs))]
    for (a, b, c) in self._tris:
      ba = vec3().subVectors(vs[b], vs[a])
      ca = vec3().subVectors(vs[c], vs[a])
      n = ba.cross(ca).normalize()
      norms[a].add(n)
      norms[b].add(n)
      norms[c].add(n)

    for n in norms:
      n.normalize()

    self._flat_norms = arrayf(norms)

  def _update(self):
    self.__build_normals()
    self._flat_tris = arrayi(self._tris)
    super(PolyMesh, self)._update()

  def content(self):
    return self.TRIANGLES

class QuadMesh(PolyMesh):
  def __init__(self):
    super(QuadMesh, self).__init__()
    self._quads = []

  def add_quad(self, a, b, c, d):
    self._quads.append((a, b, c, d))
    return self

  def add_quads(self, qs):
    self._quads.extend(qs)
    return self

  def quads(self):
    return self._quads

  def _update(self):
    for q in self._quads:
      super(QuadMesh, self).add_tri(q[0], q[1], q[2])
      super(QuadMesh, self).add_tri(q[2], q[3], q[0])

    super(QuadMesh, self)._update()

GL_CONTENT = None
def build_GL_CONTENT(gl):
  global GL_CONTENT
  if GL_CONTENT is not None:
    return
  GL_CONTENT = {}
  GL_CONTENT[Mesh.LINES] = gl.LINES;
  GL_CONTENT[Mesh.POINTS] = gl.POINTS;
  GL_CONTENT[Mesh.TRIANGLES] = gl.TRIANGLES;

class MeshGL:
  def __init__(self, gl, mesh):
    build_GL_CONTENT(gl)

    self._gl = gl
    self._mesh = mesh
    self._vbo = self._ibo = self._nbo = None
    
    self._vbo = self.__create_bo(array=mesh.verts_array(), index=False)
    
    self._inds_len = 0

    if mesh.content() == Mesh.TRIANGLES:
      self._ibo = self.__create_bo(array=mesh.tris_array(), index=True)
      self._nbo = self.__create_bo(array=mesh.norms_array(), index=False)
      self._inds_len = mesh.tris_array().len()
    elif mesh.content() == Mesh.LINES:
      self._ibo = self.__create_bo(array=mesh.lines_array(), index=True)
      self._inds_len = mesh.lines_array().len()
    elif mesh.content() == Mesh.POINTS:
      self._ibo = self.__create_bo(array=mesh.points_array(), index=True)
      self._inds_len = mesh.points_array().len()

  def __create_bo(self, array, index):
    if array is None:
      return None
    gl = self._gl
    mode = gl.ARRAY_BUFFER if not index else gl.ELEMENT_ARRAY_BUFFER
    ret = gl.createBuffer()
    gl.bindBuffer(mode, ret)
    gl.bufferData(mode, array, gl.STATIC_DRAW)
    return ret

  def update_vert(self, ind):
    if self._vbo is None:
      return
    gl = self._gl
    gl.bindBuffer(gl.ARRAY_BUFFER, self._vbo)
    # assume 32-bit float for vertex data
    vs = self._mesh.verts_array().subarray(ind * 3, 3)
    gl.bufferSubData(gl.ARRAY_BUFFER, ind * 3 * 4, vs)
    return self

  def update_all_verts(self):
    if self._vbo is None:
      return
    gl = self._gl
    gl.bindBuffer(gl.ARRAY_BUFFER, self._vbo)
    # assume 32-bit float for vertex data
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, self._mesh.verts_array())
    return self

  def mesh(self):
    return self._mesh

  def clear(self):
    gl = self._gl
    if self._vbo is not None:
      gl.deleteBuffer(self._vbo)
    if self._nbo is not None:
      gl.deleteBuffer(self._nbo)
    if self._ibo is not None:
      gl.deleteBuffer(self._ibo)
    return self

  def attach_vert(self, vert, normal=None):
    gl = self._gl
    # attaching vertices and normals
    gl.enableVertexAttribArray(vert)
    gl.bindBuffer(gl.ARRAY_BUFFER, self._vbo)
    gl.vertexAttribPointer(vert, 3, gl.FLOAT, gl.FALSE, 0, 0)

    if normal is not None and self._nbo is not None:
      gl.enableVertexAttribArray(normal)
      gl.bindBuffer(gl.ARRAY_BUFFER, self._nbo)
      gl.vertexAttribPointer(normal, 3, gl.FLOAT, gl.FALSE, 0, 0)
    return self

  def detach_vert(self, vert, normal=None):
    gl = self._gl
    # detach
    gl.disableVertexAttribArray(vert)
    if normal is not None:
      gl.disableVertexAttribArray(normal)  
    return self

  def attach_ind(self):
    gl = self._gl
    # attach indices 
    if self._ibo is not None:
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self._ibo)
    return self

  def draw(self, vert, normal=None):
    gl = self._gl

    self.attach_vert(vert, normal)
    self.attach_ind()
    self.only_draw(0, self._inds_len)
    self.detach_vert(vert, normal)
    return self

  def only_draw(self, offset, length):
    gl = self._gl
    content = GL_CONTENT[self._mesh.content()]
    # the * 2 is to account for using unsigned short
    gl.drawElements(content, length, gl.UNSIGNED_SHORT, offset * 2)
    return self

def split_quad(verts, quads, ind):
  if ind >= len(quads):
    return

  vlen = len(verts)
  new_verts = verts
  quad = quads[ind]
  center = sum_points((verts[i] for i in quad)).multiplyScalar(.25)
  for p in (verts[i] for i in quad):
    new_verts.append(p.clone().sub(center).multiplyScalar(.5).add(center))

  nquad = (vlen, vlen + 1, vlen + 2, vlen + 3)

  new_quads = [q for i, q in enumerate(quads) if i != ind]
  new_quads.extend([(quad[i], quad[j], nquad[j], nquad[i]) for i, j in\
                    ((x, (x + 1) % 4) for x in range(4))])
  new_quads.append(nquad)

  return (new_verts, new_quads)

def sum_points(gen):
  return reduce((lambda x, y: x.add(y)), gen, vec3())

def subdivide_catmull_clark(verts, faces):
  everts, fverts, vverts = [], [], []
  edges, emids = [], []
  e2ei, e2f = {}, {}

  vlen = len(verts)
  neighbors = [[] for _ in range(0, vlen)]
  v2f = [[] for _ in range(0, vlen)]

  for i, face in enumerate(faces):
    nvs = len(face)
    fverts.append(sum_points((verts[y] for y in face)).\
                    multiplyScalar(1. / nvs))

    for e0, e1 in ((face[j], face[(j + 1) % nvs]) for j in range(nvs)):
      neighbors[e0].append(e1)
      v2f[e0].append(i)
      fedge, bedge = (e0, e1), (e1, e0)
      e2f[fedge] =  i
      if e0 < e1:
        e2ei[fedge] = e2ei[bedge] = len(edges)
        edges.append(fedge)

  for e0, e1 in edges:
    f0, f1 = fverts[e2f[(e0, e1)]], fverts[e2f[(e1, e0)]]
    evert2 = verts[e0].clone().add(verts[e1])
    emids.append(evert2.clone().multiplyScalar(.5))    
    everts.append(evert2.add(f0).add(f1).multiplyScalar(.25))

  for i, adj_faces in enumerate(v2f):
    q = sum_points((fverts[y] for y in adj_faces)).\
          multiplyScalar(1. / len(adj_faces))

    r = sum_points((emids[e2ei[(i, y)]] for y in neighbors[i])).\
          multiplyScalar(1. / len(neighbors[i]))

    s = verts[i].clone()

    vverts.append(s.add(q).multiplyScalar(.25).add(r.multiplyScalar(.5)))

  fvlen = len(fverts)
  evlen = len(everts)
  fevlen = fvlen + evlen

  nfaces = []

  for i, face in enumerate(faces):
    flen = len(face)
    fgen = ((face[x - 1], face[x], face[(x + 1) % flen]) for x in range(flen))
    nfaces.extend([
        (i, e2ei[(a, b)] + fvlen, b + fevlen, e2ei[(b, c)] + fvlen)\
          for a, b, c in fgen])

  return (fverts + everts + vverts, nfaces)