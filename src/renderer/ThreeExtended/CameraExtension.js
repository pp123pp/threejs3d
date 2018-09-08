import * as THREE from 'three';

Object.assign(THREE.PerspectiveCamera.prototype, {
    
    //屏幕空间误差
    preSSE: null,
    
    //当前显示区域的宽度
    containerWidth: null,
    
    //当前显示区域的高度
    containerHeight: null
    
});