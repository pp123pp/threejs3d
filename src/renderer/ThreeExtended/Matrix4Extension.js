import * as THREE from 'three'

export const Matrix4Extension = {
    getRotation: function (matrix, result) {
    
        let e = matrix.elements;
        
        let re = result.elements;
        re[0] = e[0];
        re[1] = e[1];
        re[2] = e[2];
        re[3] = e[4];
        re[4] = e[5];
        re[5] = e[6];
        re[6] = e[8];
        re[7] = e[9];
        re[8] = e[10];
        return result;
    }
};

Object.assign(THREE.Matrix4, Matrix4Extension);
