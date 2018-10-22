import * as THREE from 'three'


const ZERO = new THREE.Vector3(0, 0, 0);

export const Vector3Extension = {
    ZERO: ZERO
};

Object.assign(THREE.Vector3, Vector3Extension);
