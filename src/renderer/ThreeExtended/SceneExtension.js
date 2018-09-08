import * as THREE from 'three';

Object.assign( THREE.Scene.prototype, {
    
    /**
     * 帧循环队列
     */
    mainLoopCollection: new Set(),
    
});