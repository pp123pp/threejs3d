import * as THREE from 'three'
import Viewer from "./widgets/viewer/Viewer";

let viewer = new Viewer("container");

import B3DMLoader from "./renderer/loaders/B3DMLoader";
import THREE3dTileset from "./renderer/3dtiles/THREE3dTileset";
import {GeometryLayer} from "./core/Scheduler/layer/GeometryLayer";

let jsonRootUrl = "https://raw.githubusercontent.com/AnalyticalGraphicsInc/3d-tiles-samples/master/tilesets/TilesetWithDiscreteLOD/tileset.json";


const b3dmLoader = new B3DMLoader();

const scene = viewer.scene;

const camera = viewer.camera;

let geometry = new THREE.BoxGeometry( 1, 1, 1 );
let material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
let cube = new THREE.Mesh( geometry, material );
viewer.scene.add( cube );

viewer.camera.position.z = 5;

let ambientLight = new THREE.AmbientLight( 0x404040 );
let directionalLight1 = new THREE.DirectionalLight( 0xC0C090 );
let directionalLight2 = new THREE.DirectionalLight( 0xC0C090 );

directionalLight1.position.set( -100, -50, 100 );
directionalLight2.position.set( 100, 50, -100 );

scene.add( directionalLight1 );
scene.add( directionalLight2 );
scene.add( ambientLight );

b3dmLoader.load({jsonRootUrl}).then(result=>{
    
    result.gltf.scene.traverse(function (child) {
        
        if(child.isMesh){
            
            child.frustumCulled = false;
            
            child.material = new THREE.MeshLambertMaterial(0xffffff);
            
        }
    });
    scene.add(result.gltf.scene)
})

let three3Dtiles = new THREE3dTileset({
    url: jsonRootUrl
});

scene.mainLoopCollection.add(three3Dtiles);

let tilesetGeometryLayer = new GeometryLayer('3d-tiles-discrete-lod', scene);

viewer.scene.control.addEventListener('change', function () {

});






