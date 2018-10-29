import * as THREE from 'three'
import {defaultValue} from "../core/defaultValue";
import Camera from "../renderer/Camera";
import {EarthControls} from "./EarthControls";
import TweenCollection from "./TweenCollection";
import {Extension} from "../renderer/ThreeExtended/Extension";
import FrameState from "./FrameState";
import Event from "../core/Event";
import {getTimestamp} from "../core/getTimestamp";
import RequestScheduler from "../core/RequestScheduler";


var _frustum = new THREE.Frustum();
var _projScreenMatrix = new THREE.Matrix4();

function updateFrameState(scene, frameNumber, time) {
    var camera = scene._camera;
    
    var frameState = scene._frameState;
    //frameState.commandList.length = 0;
    //frameState.shadowMaps.length = 0;
    //frameState.brdfLutGenerator = scene._brdfLutGenerator;
    //frameState.environmentMap = scene.skyBox && scene.skyBox._cubeMap;
    //frameState.mode = scene._mode;
    //frameState.morphTime = scene.morphTime;
    //frameState.mapProjection = scene.mapProjection;
    frameState.frameNumber = frameNumber;
    //frameState.time = JulianDate.clone(time, frameState.time);
    frameState.camera = camera;
    
    camera.updateMatrixWorld();
    
    _projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    _frustum.setFromMatrix( _projScreenMatrix );
    frameState.cullingVolume = _frustum;
    
    //frameState.occluder = getOccluder(scene);
    //frameState.terrainExaggeration = scene._terrainExaggeration;
    //frameState.minimumDisableDepthTestDistance = scene._minimumDisableDepthTestDistance;
    //frameState.invertClassification = scene.invertClassification;
    
/*    scene._actualInvertClassificationColor = Color.clone(scene.invertClassificationColor, scene._actualInvertClassificationColor);
    if (!InvertClassification.isTranslucencySupported(scene._context)) {
        scene._actualInvertClassificationColor.alpha = 1.0;
    }
    
    frameState.invertClassificationColor = scene._actualInvertClassificationColor;
    
    if (defined(scene.globe)) {
        frameState.maximumScreenSpaceError = scene.globe.maximumScreenSpaceError;
    } else {
        frameState.maximumScreenSpaceError = 2;
    }
    clearPasses(frameState.passes);*/
    
    frameState.maximumScreenSpaceError = 2;
    
    
}

function checkForCameraUpdates(scene) {
    var camera = scene._camera;
    var cameraClone = scene._cameraClone;
    
    //scene._frustumChanged = !camera.frustum.equals(cameraClone.frustum);
    
    if (!cameraEqual(camera, cameraClone, THREE.Math.EPSILON15)) {
        if (!scene._cameraStartFired) {
            camera.moveStart.raiseEvent();
            scene._cameraStartFired = true;
        }
        scene._cameraMovedTime = getTimestamp();
        cameraClone.copy(camera, true);
        
        return true;
    }
    
    if (scene._cameraStartFired && getTimestamp() - scene._cameraMovedTime > scene.cameraEventWaitTime) {
        camera.moveEnd.raiseEvent();
        scene._cameraStartFired = false;
    }
    
    return false;
}

function maxComponent(a, b) {
    var x = Math.max(Math.abs(a.x), Math.abs(b.x));
    var y = Math.max(Math.abs(a.y), Math.abs(b.y));
    var z = Math.max(Math.abs(a.z), Math.abs(b.z));
    return Math.max(Math.max(x, y), z);
}

var scratchPosition0 = new THREE.Vector3();
var scratchPosition1 = new THREE.Vector3();

function cameraEqual(camera0, camera1, epsilon) {
    
    camera0.updateMatrixWorld();
    camera0.updateProjectionMatrix();
    
    camera1.updateMatrixWorld();
    camera1.updateProjectionMatrix();
    
    var scalar = 1 / Math.max(1, maxComponent(camera0.position, camera1.position));
    scratchPosition0.copy(camera0.position).multiplyScalar(scalar);
    scratchPosition1.copy(camera1.position).multiplyScalar(scalar);
    
    return THREE.Vector3.equalsEpsilon(scratchPosition0, scratchPosition1, epsilon) &&
        THREE.Vector3.equalsEpsilon(camera0.worldDirection, camera1.worldDirection, epsilon) &&
        THREE.Vector3.equalsEpsilon(camera0.up, camera1.up, epsilon) &&
        THREE.Matrix4.equalsEpsilon(camera0.matrixWorld, camera1.matrixWorld, epsilon)
}

function tryAndCatchError(scene, time, functionToExecute) {
    try {
        functionToExecute(scene, time);
    } catch (error) {
        scene._renderError.raiseEvent(scene, error);
        
        if (scene.rethrowRenderErrors) {
            throw error;
        }
    }
}


export default class GlobeScene extends THREE.Scene{
    constructor(container, option = {}){

        super();
    
        /**
         * 帧循环队列
         */
        this.mainLoopCollection = new Set();

        //webGLRenderer选项
        let renderState = defaultValue(option.renderState, {});

        //抗锯齿默认开启
        renderState.antialias = defaultValue( renderState.antialias, true);

        this._shaderFrameCount = 0;

        this._tweens = new TweenCollection();

        this.clock = new THREE.Clock();

        this._renderer = new THREE.WebGLRenderer(renderState);

        this._camera = new Camera({
            fov: 60,
            aspect: container.clientWidth/container.clientHeight,
            near: 0.1,
            far: 500000000
        });

        this._renderer.setSize( container.clientWidth, container.clientHeight);

        this._control = new EarthControls(this);

        container.appendChild(this._renderer.domElement);

        this._frameState = new FrameState(this._renderer.context);

        this._frameState.camera = this._camera;
    
        //frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
        
        this._frameState.renderer = this._renderer;
    
        this._frameState.scene = this;
        
        this._preUpdate = new Event();
    
        this._renderError = new Event();
        
        this._cameraClone = new Camera().copy(this._camera, true);
    
        this._cameraStartFired = false;
        
        this.cameraEventWaitTime = 500.0;
        
        updateFrameState(this, 0.0)
        
    }

    //帧循环事件
    updateFixedFrame() {

        let values = this.mainLoopCollection.values();

        for(let value of values){
            value.updateFixedFrame(this._frameState);
        }

    }

    /**
     * @private
     */
    initializeFrame(){
        if(this._shaderFrameCount++ === 120){
            //this._shaderFrameCount = 0;

        }

        this._tweens.update();

        this._control.update(this.clock.getDelta());
        this.camera._updateCameraChanged();
        this.updateFixedFrame(this._frameState)

    }
    
    renderFixedFrame(){
        
        this._preUpdate.raiseEvent();
        
        let cameraChanged = checkForCameraUpdates(this);
        
        RequestScheduler.update();
        
    }

    get renderer(){
        return this._renderer;
    }

    get camera(){
        return this._camera;
    }

    get drawingBufferWidth(){
        return this._renderer.drawingBufferWidth;
    }

    get drawingBufferHeight(){
        return this._renderer.drawingBufferHeight;
    }

    get domElement(){
        return this.renderer.domElement
    }

    get control(){
        return this._control
    }
}
