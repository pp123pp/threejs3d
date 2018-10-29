import * as when from './../ThirdParty/when';
import * as THREE from 'three';
import {Check} from "../core/Check";
import B3DMLoader from "../renderer/loaders/B3DMLoader";
import {defined} from "../core/defined";

export default class GLFTModel extends THREE.Object3D{
    constructor() {
        super();

        this._readyPromise = when.defer();

        this.loader = new B3DMLoader();

    }

    static fromUrl(options = {}){

        let url = options.url;

        Check.typeOf.string('options.url', url);

        let model = new GLFTModel();

        model.loader.load(options).then(result=>{
            result.gltf.scene.traverse(child=>{

                if(!defined(child.isMesh)) return;

                child.frustumCulled = false;

                child.material = new THREE.MeshLambertMaterial(0xffffff);

            });

            let object = result.gltf.scene;
            model._readyPromise.resolve(object);

            model.add(object)
        });

        return model;

    }

    static fromArrayBuffer(arrayBuffer, gltfUpAxis){

        let model = new GLFTModel();

        model.loader.parse(arrayBuffer, gltfUpAxis).then(result=>{
            result.gltf.scene.traverse(child=>{

                if(!defined(child.isMesh)) return;

                child.frustumCulled = false;

                child.material = new THREE.MeshLambertMaterial(0xffffff);

            });

            let object = result.gltf.scene;
            model._readyPromise.resolve(object);

            model.add(object)
        })

        return model

    }

    get readyPromise(){
        return this._readyPromise.promise
    }


}
