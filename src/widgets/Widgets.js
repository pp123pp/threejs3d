import * as THREE from 'three'
import {defined} from "../core/defined";
import DeveloperError from "../core/DeveloperError";
import {getElement} from "./getElement";
import {defaultValue} from "../core/defaultValue";
import GlobeScene from "../scene/GlobeScene";
import '../renderer/ThreeExtended/Extension'


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


        resize();

        function resize() {

            let [containerWidth,containerHeight ] = [ container.clientWidth, container.clientHeight];

            camera.aspect = containerWidth/containerHeight;

            camera.updateProjectionMatrix();

            renderer.setSize( containerWidth, containerHeight );

            camera.containerWidth = containerWidth;

            camera.containerHeight = containerHeight;

            camera.resize({scene, camera, renderer});

        }

        if(defined(window.addEventListener)){

            window.addEventListener( 'resize', resize, false)

        }

        let animate = function () {

            requestAnimationFrame( animate );

            let [containerWidth,containerHeight ] = [ container.clientWidth, container.clientHeight];

            camera.containerWidth = containerWidth;

            camera.containerHeight = containerHeight;

            camera.preUpdate({scene, camera, renderer});

            scene.mainLoopCollection.forEach(value => {

                value.mainLoopUpdate({scene, camera, renderer})

            });

            renderer.render( scene, camera );

            scene.dispatchEvent({type: "preUpdate"})
        };

        animate();

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
}
