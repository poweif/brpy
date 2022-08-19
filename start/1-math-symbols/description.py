from md import *

kd("""

### Math Symbols ###
[KaTeX](https://github.com/Khan/KaTeX) was used to display math symbols. 
Here are some examples
- Inline math is possible (e.g $f(x)=x+1$) with this tool
- $\sum_{i}^{10}{i}$
- $f(\pi) =\sin(\pi) + \cos(\pi)$
- $\Pi(x) = x ( x + 2)$

Math content needs to be bounded by \$ (dollar signs). A reference to TeX
symbols is available
[here](http://www.artofproblemsolving.com/wiki/index.php/LaTeX:Symbols).
""") 

total = 1
fac_num = 25
for i in range(1, fac_num):
  total = total * i

kd("###For Fun###\n $%i!=%i$" % (fac_num, total))
