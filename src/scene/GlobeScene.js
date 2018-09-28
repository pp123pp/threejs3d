import * as THREE from 'three'
import {defaultValue} from "../core/defaultValue";
import '../renderer/ThreeExtended/Extension'
import Camera from "../renderer/Camera";
import {EarthControls} from "./EarthControls";


export default class GlobeScene extends THREE.Scene{
    constructor(container, option = {}){

        super();

        //webGLRenderer选项
        let renderState = defaultValue(option.renderState, {});

        //抗锯齿默认开启
        renderState.antialias = defaultValue( renderState.antialias, true);

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
