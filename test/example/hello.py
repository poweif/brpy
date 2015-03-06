from math import sin

import webgl
from webgl.three import arrayf, mat4, vec3

VS_SRC = """
attribute vec3 _vert_pos;
attribute vec3 _vert_color;
varying highp vec4 v_color;
void main(void) {
  gl_Position = vec4(_vert_pos, 1.0);
  v_color = vec4(_vert_color, 1.0);
}
"""

FS_SRC = """
varying highp vec4 v_color;
void main(void) {
  gl_FragColor = v_color;
}
"""

def setup(gl, program, color_buffer):
  vs = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vs, VS_SRC)
  gl.compileShader(vs)

  fs = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fs, FS_SRC)
  gl.compileShader(fs)

  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  gl.useProgram(program)

  vertex_colors = arrayf([1.0, 0.0, 0.0,
                          0.0, 1.0, 0.0,
                          0.0, 0.0, 1.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertex_colors, gl.STATIC_DRAW)

  gl.clearColor(1.0, 1.0, 1.0, 1.0)

def render(gl, program, vertex_buffer, color_buffer):
  gl.clear(gl.COLOR_BUFFER_BIT)
  vertices = arrayf([ 0.0,  0.5, 0.0,
                     -0.5, -0.5, 0.0,
                      0.5, -0.5, 0.0])
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
  vert_pos_attrib = gl.getAttribLocation(program, "_vert_pos")
  gl.enableVertexAttribArray(vert_pos_attrib)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
  gl.vertexAttribPointer(vert_pos_attrib, 3, gl.FLOAT, False, 0, 0)

  vert_color_attrib = gl.getAttribLocation(program, "_vert_color")
  gl.enableVertexAttribArray(vert_color_attrib)
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer)
  gl.vertexAttribPointer(vert_color_attrib, 3, gl.FLOAT, False, 0, 0)

  gl.drawArrays(gl.TRIANGLES, 0, 3)

def mouseClick(gl, button, state, x, y):
  print str(x) + " " + str(y)

def reshape(gl, program, vertex_buffer, color_buffer, width, height):
  global _arcball, _width, _height
  _width, _height = width, height
  gl.viewport(0, 0, width, height)
  render(gl, program=program, vertex_buffer=vertex_buffer, color_buffer=color_buffer)

def main():
  gl, glut = webgl.glutCreateWindow()
  program = gl.createProgram()
  vbo = gl.createBuffer()
  cbo = gl.createBuffer()

  setup(gl, program, color_buffer=cbo)
  render(gl, program=program, vertex_buffer=vbo, color_buffer=cbo)

  def reshape_outer(gl, width, height):
    reshape(gl, program, vbo, cbo, width, height)

  glut.mouseFunc(mouseClick)
  glut.reshapeFunc(reshape_outer)

main()