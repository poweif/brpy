from math import sin

import webgl
import webgl.glut

from webgl.three import mat4
from webgl.three import vec3
from webgl.three import arrayf

gl = webgl.Context("mainPanelCanvas")
glut = webgl.glut.Init(gl)

vertex_buffer = gl.createBuffer()
color_buffer = gl.createBuffer()
program = None

vs_src = """
attribute vec3 _vert_pos;
attribute vec3 _vert_color;
varying highp vec4 v_color;
void main(void) {
  gl_Position = vec4(_vert_pos, 1.0);
  v_color = vec4(_vert_color, 1.0);
}
"""

fs_src = """
varying highp vec4 v_color;
void main(void) {
  gl_FragColor = v_color;
}
"""

def setup():
  global program
  vs = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vs, vs_src)
  gl.compileShader(vs)
  print ("Vertex shader COMPILE_STATUS: " +
         str(gl.getShaderParameter(vs, gl.COMPILE_STATUS)))
  fs = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fs, fs_src)
  gl.compileShader(fs)
  print ("Fragment shader COMPILE_STATUS: " +
         str(gl.getShaderParameter(fs, gl.COMPILE_STATUS)))

  program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  print ("Program LINK_STATUS: " +
         str(gl.getProgramParameter(program, gl.LINK_STATUS)))
  gl.useProgram(program)

  vertex_colors = arrayf([1.0, 0.0, 0.0,
                         1.0, 0.0, 1.0,
                         1.0, 0.0, 0.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertex_colors, gl.STATIC_DRAW)

def render(gl):
  gl.clearColor(1.0, 0.9, 1.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, 500, 500)
  vertices = arrayf([-0.7,  -0.5, 0.0,
                     0.0,  -.5, 0.0,
                     -0.7, -0.95, 0.0])
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

def mouse(gl, button, state, x, y):
  print str(x) + " " + str(y)

def mouseMove(gl, x, y):
  print 'mouse moving: ' + str(x) + ' ' + str(y)

def keyboard(gl, ch, x, y):
  print 'pressed ' + ch + ' with position at: ' + str(x) + ' ' + str(y)

def main():
  setup()
  glut.displayFunc(render)
  glut.mouseFunc(mouse)
#  glut.keyboardFunc(keyboard)

main()