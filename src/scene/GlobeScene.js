import * as THREE from 'three'
import {defaultValue} from "../core/defaultValue";
import Camera from "../renderer/Camera";
import {EarthControls} from "./EarthControls";
import TweenCollection from "./TweenCollection";
import {Extension} from "../renderer/ThreeExtended/Extension";
import FrameState from "./FrameState";


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
