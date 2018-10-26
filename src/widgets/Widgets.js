import * as THREE from 'three'
import {defined} from "../core/defined";
import DeveloperError from "../core/DeveloperError";
import {getElement} from "./getElement";
import {defaultValue} from "../core/defaultValue";
import GlobeScene from "../scene/GlobeScene";

function startRenderLoop(widget) {
    widget._renderLoopRunning = true;

    let lastFrameTime = 0;
    function render(frameTime) {
        if (widget.isDestroyed()) {
            return;
        }

        if (widget._useDefaultRenderLoop) {
            try {
                let targetFrameRate = widget._targetFrameRate;
                if (!defined(targetFrameRate)) {
                    widget.resize();
                    widget.renderFixedFrame();

                    requestAnimationFrame(render);
                } else {
                    let interval = 1000.0 / targetFrameRate;
                    let delta = frameTime - lastFrameTime;

                    if (delta > interval) {
                        widget.resize();
                        widget.renderFixedFrame();
                        lastFrameTime = frameTime - (delta % interval);
                    }
                    requestAnimationFrame(render);
                }
            } catch (error) {
                widget._useDefaultRenderLoop = false;
                widget._renderLoopRunning = false;
                if (widget._showRenderLoopErrors) {
                    let title = 'An error occurred while rendering.  Rendering has stopped.';
                    //widget.showErrorPanel(title, undefined, error);
                    
                    console.log(error)
                }
            }
        } else {
            widget._renderLoopRunning = false;
        }
    }

    requestAnimationFrame(render);
}

function configureCanvasSize(widget) {
    let canvas = widget._canvas;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let resolutionScale = widget._resolutionScale;
    /*if (!widget._supportsImageRenderingPixelated) {
        resolutionScale *= defaultValue(window.devicePixelRatio, 1.0);
    }*/

    widget._canvasWidth = width;
    widget._canvasHeight = height;

    width *= resolutionScale;
    height *= resolutionScale;

    canvas.width = width;
    canvas.height = height;

    widget._canRender = width !== 0 && height !== 0;
}

function configureCameraFrustum(widget) {
    let canvas = widget._canvas;
    let width = canvas.width;
    let height = canvas.height;
    if (width !== 0 && height !== 0) {

        widget.renderer.setSize( width, height );

        widget.camera.resize(widget._canvas)
    }
}

//场景组件
export default class Widgets {

    constructor(container, options){

        if(!defined(container)){throw new DeveloperError("container 参数不能为空")}

        container = getElement(container);

        options = defaultValue(options, {});

        let scene = new GlobeScene(container, options);

        let skyBox = options.skyBox;
        if(!defined(skyBox)){

            skyBox = new THREE.CubeTextureLoader()
                .setPath('./')
                .load( [
                    require('./../static/images/skyBox/px.png'),
                    require('./../static/images/skyBox/nx.png'),
                    require('./../static/images/skyBox/py.png'),
                    require('./../static/images/skyBox/ny.png'),
                    require('./../static/images/skyBox/pz.png'),
                    require('./../static/images/skyBox/nz.png')
                ] );
        }

        if(skyBox !== false){
            scene.background = skyBox;
        }

        let renderer = scene.renderer;

        let camera = scene.camera;

        this._renderer = renderer;

        this._camera = camera;

        this._scene = scene;

        this._canRender = true;

        this._renderLoopRunning = false;

        this._useDefaultRenderLoop = undefined;
        this.useDefaultRenderLoop = defaultValue(options.useDefaultRenderLoop, true);

        this._targetFrameRate = undefined;
        this.targetFrameRate = options.targetFrameRate;

        this._resolutionScale = 1.0;

        this._container = container;
        this._canvas = container;
        this._canvasWidth = 0;
        this._canvasHeight = 0;


        this._canvas.oncontextmenu = function() {
            return false;
        };
        this._canvas.onselectstart = function() {
            return false;
        };

    }

    resize(){

        let canvas = this._canvas;
        let width = canvas.clientWidth;
        let height = canvas.clientHeight;
        if (!this._forceResize && this._canvasWidth === width && this._canvasHeight === height) {
            return;
        }

        this._forceResize = false;
        configureCanvasSize(this);
        configureCameraFrustum(this);
    }
    
    renderFixedFrame(){
        if(this._canRender){
            this._renderer.render( this._scene, this._camera );
            this._scene.initializeFrame();
            this.scene.renderFixedFrame()
        }
    }

    isDestroyed(){
        return false
    }

    get scene(){
        return this._scene
    }

    get camera(){
        return this._camera
    }

    get renderer(){
        return this._renderer
    }

    get control(){
        return this.scene.control
    }

    get useDefaultRenderLoop(){
        return this._useDefaultRenderLoop;
    }

    set useDefaultRenderLoop(value){
        if (this._useDefaultRenderLoop !== value) {
            this._useDefaultRenderLoop = value;
            if (value && !this._renderLoopRunning) {
                startRenderLoop(this);
            }
        }
    }

    get resolutionScale(){
        return this._resolutionScale;
    }

    set resolutionScale(value){
        //>>includeStart('debug', pragmas.debug);
        if (value <= 0) {
            throw new DeveloperError('resolutionScale must be greater than 0.');
        }
        //>>includeEnd('debug');
        this._resolutionScale = value;
        this._forceResize = true;
    }
}
