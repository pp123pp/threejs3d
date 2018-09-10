import * as THREE from 'three';
import {defined} from "../../defined";

function GeometryLayer(id, object3d) {
    
    if(!defined(id)){
        throw new Error('Missing id parameter (GeometryLayer must have a unique id defined)');
    }
    
    if (!object3d || !object3d.isObject3D) {
        throw new Error('Missing/Invalid object3d parameter (must be a three.js Object3D instance)');
    }
    
    this._object3d = object3d;
    
    this._id = id;
    
}

GeometryLayer.prototype = Object.create(THREE.EventDispatcher.prototype);
GeometryLayer.prototype.constructor = GeometryLayer;

export {GeometryLayer}

