#/bin/sh

function cp_skulpt() {
    cp -r ../../skulpt/dist ./skulpt
}

function update() {
    # Nodejs packages
    npm install
    # Bower
    bower update
}

function libigl_update() {
cd nacl

if [ ! -d ./libigl ]; then
   git clone https://github.com/libigl/libigl.git
fi

if [ ! -d ./eigen ]; then
   hg clone https://bitbucket.org/eigen/eigen/
   cd ./eigen/unsupported/Eigen/src/SparseExtra
   patch < ../../../../../MatrixMarketIterator.patch
   cd ../../../../../
fi

if [ ! -d ./libigl/include/Eigen ]; then
    cd libigl/include
    ln -s ../../eigen/Eigen .
    cd ../../
fi

if [ ! -d ./libigl/include/unsupported ]; then
    cd libigl/include
    ln -s ../../eigen/unsupported .
    cd ../../
fi

cd ..
}

cp_skulpt
update
libigl_update
