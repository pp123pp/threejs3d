import * as THREE from 'three'
import {OrientedBoundingBox} from "../core/OrientedBoundingBox";
import {Check} from "../core/Check";

export default class TileOrientedBoundingBox {
    constructor(center, halfAxes){
        this._orientedBoundingBox = new OrientedBoundingBox(center, halfAxes);
        this._boundingSphere = THREE.Sphere.fromOrientedBoundingBox(this._orientedBoundingBox);
    }
    
    distanceToCamera(frameState){
        //>>includeStart('debug', pragmas.debug);
        Check.defined('frameState', frameState);
        //>>includeEnd('debug');
        return Math.sqrt(this._orientedBoundingBox.distanceSquaredTo(frameState.camera.position));
    }
    
    intersectPlane(plane){
        //>>includeStart('debug', pragmas.debug);
        Check.defined('plane', plane);
        //>>includeEnd('debug');
        return this._orientedBoundingBox.intersectPlane(plane);
    }
    
    get boundingVolume(){
        return this._orientedBoundingBox;
    }
    
    get boundingSphere(){
        return this._boundingSphere;
    }
    
}


