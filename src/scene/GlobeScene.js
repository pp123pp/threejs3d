import * as THREE from 'three'
import {defaultValue} from "../core/defaultValue";
import Camera from "../renderer/Camera";
import {EarthControls} from "./EarthControls";
import TweenCollection from "./TweenCollection";
import {Extension} from "../renderer/ThreeExtended/Extension";
import FrameState from "./FrameState";

export default class GlobeScene extends THREE.Scene{
    constructor(container, option = {}){

        super();

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

        this._frameState = new FrameState(container);

        this._frameState.camera = this._camera;

    }

    //帧循环事件
    updateFixedFrame() {

        let values = this.mainLoopCollection.values();

        for(let value of values){
            value.updateFixedFrame();
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
