# arcball.py

# From Nehe tutorial

from math import sqrt
from webgl.three import vec3, quat

Epsilon = 1.0e-5

class ArcBall:
  def __init__(self, new_width, new_height):
    self.st_vec = vec3()
    self.en_vec = vec3()
    self.adjusted_width = 1.0
    self.adjusted_height = 1.0
    self.set_bounds(new_width, new_height)

  def set_bounds(self, new_width, new_height):
    self.adjusted_width = 2.0 / (new_width - 1.0)
    self.adjusted_height = 2.0 / (new_height - 1.0)

  def __map_to_sphere(self, new_pt):
    tmp = vec3(new_pt.x() * self.adjusted_width - 1.0,
               1.0 - (new_pt.y() * self.adjusted_height),
               0)
    
    length = tmp.lengthSq()
    new_vec = vec3()
    if length > 1.0:
      norm = 1.0 / sqrt(length);
      new_vec.setX(tmp.x() * norm)
      new_vec.setY(tmp.y() * norm)
      new_vec.setZ(0)
    else:
      new_vec.setX(tmp.x())
      new_vec.setY(tmp.y())
      new_vec.setZ(sqrt(1.0 - length))
    return new_vec

  def click(self, new_pt):
    self.st_vec = self.__map_to_sphere(new_pt)

  def drag(self, new_pt):
    self.en_vec = self.__map_to_sphere(new_pt)
    perp = vec3().crossVectors(self.st_vec, self.en_vec)

    new_rot = quat()
    if (perp.len() > Epsilon):
      new_rot.set(perp.x(), perp.y(), perp.z(), 
                  self.st_vec.dot(self.en_vec))
    else:
      new_rot.set(0, 0, 0, 1)
    return new_rot