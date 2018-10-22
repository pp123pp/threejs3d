import * as THREE from 'three'
import {Check} from "../../core/Check";
import {defined} from "../../core/defined";


let fromOrientedBoundingBoxScratchU = new THREE.Vector3();
let fromOrientedBoundingBoxScratchV = new THREE.Vector3();
let fromOrientedBoundingBoxScratchW = new THREE.Vector3();


export const SphereExtension = {
    fromOrientedBoundingBox: function (orientedBoundingBox, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('orientedBoundingBox', orientedBoundingBox);
        //>>includeEnd('debug');
    
        if (!defined(result)) {
            result = new THREE.Sphere();
        }
    
        let halfAxes = orientedBoundingBox.halfAxes;
        let u = THREE.Matrix3.getColumn(halfAxes, 0, fromOrientedBoundingBoxScratchU);
        let v = THREE.Matrix3.getColumn(halfAxes, 1, fromOrientedBoundingBoxScratchV);
        let w = THREE.Matrix3.getColumn(halfAxes, 2, fromOrientedBoundingBoxScratchW);
    
        u.add(v);
        u.add(w);
    
        result.center = new THREE.Vector3().copy(orientedBoundingBox.center);
        result.radius = u.length();
    
        return result;
    }
};

Object.assign(THREE.Sphere, SphereExtension);
