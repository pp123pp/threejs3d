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
    
        let leftElement = left.elements;
        let rightElement = right.elements;
        
        return (leftElement === rightElement) ||
            (defined(leftElement) &&
                defined(rightElement) &&
                Math.abs(leftElement[0] - rightElement[0]) <= epsilon &&
                Math.abs(leftElement[1] - rightElement[1]) <= epsilon &&
                Math.abs(leftElement[2] - rightElement[2]) <= epsilon &&
                Math.abs(leftElement[3] - rightElement[3]) <= epsilon &&
                Math.abs(leftElement[4] - rightElement[4]) <= epsilon &&
                Math.abs(leftElement[5] - rightElement[5]) <= epsilon &&
                Math.abs(leftElement[6] - rightElement[6]) <= epsilon &&
                Math.abs(leftElement[7] - rightElement[7]) <= epsilon &&
                Math.abs(leftElement[8] - rightElement[8]) <= epsilon &&
                Math.abs(leftElement[9] - rightElement[9]) <= epsilon &&
                Math.abs(leftElement[10] - rightElement[10]) <= epsilon &&
                Math.abs(leftElement[11] - rightElement[11]) <= epsilon &&
                Math.abs(leftElement[12] - rightElement[12]) <= epsilon &&
                Math.abs(leftElement[13] - rightElement[13]) <= epsilon &&
                Math.abs(leftElement[14] - rightElement[14]) <= epsilon &&
                Math.abs(leftElement[15] - rightElement[15]) <= epsilon);
    }
};

Object.assign(THREE.Matrix4, Matrix4Extension);
