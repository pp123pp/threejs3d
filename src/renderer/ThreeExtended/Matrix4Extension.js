import * as THREE from 'three'
import {defined} from "../../core/defined";
import {Check} from "../../core/Check";

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
    },
    
    equalsEpsilon: function (left, right, epsilon) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('epsilon', epsilon);
        //>>includeEnd('debug');
    
        return (left === right) ||
            (defined(left) &&
                defined(right) &&
                Math.abs(left[0] - right[0]) <= epsilon &&
                Math.abs(left[1] - right[1]) <= epsilon &&
                Math.abs(left[2] - right[2]) <= epsilon &&
                Math.abs(left[3] - right[3]) <= epsilon &&
                Math.abs(left[4] - right[4]) <= epsilon &&
                Math.abs(left[5] - right[5]) <= epsilon &&
                Math.abs(left[6] - right[6]) <= epsilon &&
                Math.abs(left[7] - right[7]) <= epsilon &&
                Math.abs(left[8] - right[8]) <= epsilon &&
                Math.abs(left[9] - right[9]) <= epsilon &&
                Math.abs(left[10] - right[10]) <= epsilon &&
                Math.abs(left[11] - right[11]) <= epsilon &&
                Math.abs(left[12] - right[12]) <= epsilon &&
                Math.abs(left[13] - right[13]) <= epsilon &&
                Math.abs(left[14] - right[14]) <= epsilon &&
                Math.abs(left[15] - right[15]) <= epsilon);
    }
};

Object.assign(THREE.Matrix4, Matrix4Extension);
