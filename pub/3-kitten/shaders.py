# shaders.py

PHONG_VS = """
attribute vec3 _pos;
attribute vec3 _normal;

uniform mat4 _model;
uniform mat4 _model_inv_tr;
uniform mat4 _model_view_proj;
uniform mat4 _view_inv;

varying highp vec3 v_model_eye;
varying highp vec3 v_model_normal;
varying highp vec3 v_model_pos;

void main(void) {
  v_model_normal = (_model_inv_tr * vec4(_normal, 0.0)).xyz;
  v_model_pos = (_model * vec4(_pos, 1.0)).xyz;
  v_model_eye = normalize(v_model_pos - _view_inv[3].xyz);
  gl_Position = _model_view_proj * vec4(_pos, 1.0);
}
"""

PHONG_FS = """
precision mediump float;

varying highp vec3 v_model_eye;
varying highp vec3 v_model_normal;
varying highp vec3 v_model_pos;

void main(void) {
  float spec_coeff = 20.0;
  vec3 light_pos = vec3(0, 0.5, 5);
  vec3 L = normalize(light_pos - v_model_pos);
  vec3 N = normalize(v_model_normal);
  vec3 V = normalize(v_model_eye);
  float dd = max(0., dot(-N, L));
  vec3 R = normalize(2. * dd * N - L);
  float diff = dd * .6;
  float amb = .3;
  float spec = pow(max(0., dot(R, V)), spec_coeff) * .35;
  gl_FragColor = vec4(vec3(.70, .8, .95) * (amb + diff) + vec3(spec), 1);
}
"""

FRAME_VS = """
uniform mat4 _model_view_proj;
uniform vec4 _color;
attribute vec3 _pos;
varying vec4 v_color;

void main() {
  gl_PointSize = 10.;
  gl_Position = _model_view_proj * vec4(_pos.xyz, 1.);
  v_color = _color;
}
"""

FRAME_FS = """
precision mediump float;
varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}
"""

class Program:
  def __init__(self, gl, vert_src, frag_src):
    self._gl = gl                   
    self._vert= self.__init_shader(gl.VERTEX_SHADER, vert_src)
    self._frag= self.__init_shader(gl.FRAGMENT_SHADER, frag_src)
    self._prog = gl.createProgram()

    gl.attachShader(self._prog, self._vert)
    gl.attachShader(self._prog, self._frag)
    gl.linkProgram(self._prog)  
    if not gl.getProgramParameter(self._prog, gl.LINK_STATUS):
      print "LINKING> " + str(gl.getProgramInfoLog(self._prog))
      self._prog = None

    self._attribs = {}
    self._uniforms = {}

  def __init_shader(self, typ, src):
    gl = self._gl
    typ_str = "VERTEX" if typ == gl.VERTEX_SHADER else "FRAGMENT"
    shader = gl.createShader(typ)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if not gl.getShaderParameter(shader, gl.COMPILE_STATUS):
      print typ_str + " SHADER> " + str(gl.getShaderInfoLog(self._prog))
      gl.deleteShader(shader)
      shader = None
    return shader

  def attrib(self, attrib):
    gl = self._gl
    if not attrib in self._attribs:
      self._attribs[attrib] = gl.getAttribLocation(self._prog, attrib)
    return self._attribs[attrib]

  def __get_uniform(self, uniform):
    gl = self._gl
    if not uniform in self._uniforms:
      self._uniforms[uniform] = gl.getUniformLocation(self._prog, uniform)
    return self._uniforms[uniform]
  
  def set_uniform_matrices(self, uniform_mats):
    gl = self._gl
    for u in uniform_mats:
      gl.uniformMatrix4fv(self.__get_uniform(u), gl.FALSE, uniform_mats[u])
    return self
  
  def set_uniform_vec4(self, u, v):
    gl = self._gl
    gl.uniformVec4(self.__get_uniform(u), v)
    return self

  def set_uniform1f(self, u, f):
    gl = self._gl
    gl.uniform1f(self.__get_uniform(u), f)
    return self
    
  def use(self):
    gl = self._gl
    gl.useProgram(self._prog)
    return self