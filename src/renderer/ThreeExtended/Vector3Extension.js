import * as THREE from 'three'
import {defined} from "../../core/defined";


const ZERO = new THREE.Vector3(0, 0, 0);

export const Vector3Extension = {
    
    ZERO: ZERO,
    
    equalsEpsilon: function (left, right, relativeEpsilon, absoluteEpsilon) {
        return (left === right) ||
            (defined(left) &&
                defined(right) &&
                THREE.Math.equalsEpsilon(left.x, right.x, relativeEpsilon, absoluteEpsilon) &&
                THREE.Math.equalsEpsilon(left.y, right.y, relativeEpsilon, absoluteEpsilon) &&
                THREE.Math.equalsEpsilon(left.z, right.z, relativeEpsilon, absoluteEpsilon));
    }
};

Object.assign(THREE.Vector3, Vector3Extension);
