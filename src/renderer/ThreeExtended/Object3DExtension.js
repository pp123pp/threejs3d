import * as THREE from 'three'

export const Object3DExtension = {
    mainLoopCollection: new Set()
};

Object.assign(THREE.Object3D.prototype, Object3DExtension);
