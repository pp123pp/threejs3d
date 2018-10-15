import {E3D} from "./E3D";
let jsonRootUrl = "https://raw.githubusercontent.com/AnalyticalGraphicsInc/3d-tiles-samples/master/tilesets/TilesetWithDiscreteLOD/tileset.json";

let viewer = new E3D.Viewer("container");

const scene = viewer.scene;

const camera = viewer.camera;

let geometry = new E3D.THREE.BoxGeometry( 1, 1, 1 );
let material = new E3D.THREE.MeshBasicMaterial( { color: 0x00ff00 } );
let cube = new E3D.THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 10;

let ambientLight = new E3D.THREE.AmbientLight( 0x404040 );
let directionalLight1 = new E3D.THREE.DirectionalLight( 0xC0C090 );
let directionalLight2 = new E3D.THREE.DirectionalLight( 0xC0C090 );

directionalLight1.position.set( -100, -50, 100 );
directionalLight2.position.set( 100, 50, -100 );

scene.add( directionalLight1 );
scene.add( directionalLight2 );
scene.add( ambientLight );


scene.control.addIntersectObject(cube);




let tileset = E3D.Tileset.fromJson({
    url: jsonRootUrl
})

/*tileset.readyPromise.then((value => {
    console.log(value)
}))*/

console.log(tileset.readyPromise)

















