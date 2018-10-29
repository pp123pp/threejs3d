import * as when from './../ThirdParty/when';
import * as THREE from 'three';
import {Check} from "../core/Check";
import B3DMLoader from "../renderer/loaders/B3DMLoader";
import {defined} from "../core/defined";

//记录当前模型所处状态
const ModelState = {
    NEEDS_LOAD : 0,
    LOADING : 1,
    LOADED : 2,  // Renderable, but textures can still be pending when incrementallyLoadTextures is true.
    FAILED : 3
};

export default class GLFTModel extends THREE.Object3D{
    constructor() {
        super();

        this._readyPromise = when.defer();

        this.loader = new B3DMLoader();
        
        this._state = ModelState.NEEDS_LOAD;

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
    
            model.add(object)
            model._readyPromise.resolve(model);

            
        })

        return model

    }

    get readyPromise(){
        return this._readyPromise.promise
    }


}
