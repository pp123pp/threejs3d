import * as THREE from 'three'
import Viewer from "./widgets/viewer/Viewer";

let viewer = new Viewer("container");

import B3DMLoader from "./renderer/loaders/B3DMLoader";

let jsonRootUrl = "https://raw.githubusercontent.com/AnalyticalGraphicsInc/3d-tiles-samples/master/tilesets/TilesetWithDiscreteLOD/tileset.json";


const b3dmLoader = new B3DMLoader();

const scene = viewer.scene;

const camera = viewer.camera;

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
viewer.scene.add( cube );

viewer.camera.position.z = 5;


var ambientLight = new THREE.AmbientLight( 0x404040 );
var directionalLight1 = new THREE.DirectionalLight( 0xC0C090 );
var directionalLight2 = new THREE.DirectionalLight( 0xC0C090 );

directionalLight1.position.set( -100, -50, 100 );
directionalLight2.position.set( 100, 50, -100 );

scene.add( directionalLight1 );
scene.add( directionalLight2 );
scene.add( ambientLight );



b3dmLoader.load({jsonRootUrl: jsonRootUrl}).
then(result=>{
    const init = function f_init(mesh) {
        mesh.frustumCulled = false;
        if (mesh.material) {
            if (true) {
                mesh.material = new THREE.MeshLambertMaterial(0xffffff);
            }
        }
    };
    result.gltf.scene.traverse(init);
    const batchTable = result.batchTable;
    const object3d = result.gltf.scene;


    viewer.scene.add(object3d.children[0])
})
