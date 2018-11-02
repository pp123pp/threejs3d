import {E3D} from "./E3D";
import {defined} from "./core/defined";
import * as THREE from "three";
let jsonRootUrl = "https://raw.githubusercontent.com/AnalyticalGraphicsInc/3d-tiles-samples/master/tilesets/TilesetWithDiscreteLOD/tileset.json";

let viewer = new E3D.Viewer("container");

const scene = viewer.scene;

const camera = viewer.camera;

let geometry = new E3D.THREE.BoxGeometry( 1, 1, 1 );
let material = new E3D.THREE.MeshBasicMaterial( { color: 0x00ff00, transparent: true, opacity: 0.2 } );
let cube = new E3D.THREE.Mesh( geometry, material );
scene.add( cube );

//console.log(cube)

camera.position.set(1215107.7612304366, -4736682.902037748, 4088147.7201135154);

//camera.position.set(0, 0, 10);

//camera.position.set(1216007.2404122227, -4736883.208557791, 4104418.1937482036);


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

//console.log(tileset)

scene.add(tileset)

scene.mainLoopCollection.add(tileset)

scene.control.addIntersectObject(tileset);

tileset.readyPromise.then(object=>{
    //console.log(object)
})


/*
let loader = new E3D.B3DMLoader().load({
    url: "https://raw.githubusercontent.com/AnalyticalGraphicsInc/3d-tiles-samples/master/tilesets/TilesetWithDiscreteLOD/dragon_medium.b3dm"
}).then(result=>{
    result.gltf.scene.traverse(child=>{
        
        if(!defined(child.isMesh)) return;
        
        child.frustumCulled = false;
        
        child.material = new THREE.MeshLambertMaterial(0xffffff);
        
    });
    
    let object = result.gltf.scene;
    
    //scene.add(object);
    scene.control.addIntersectObject(object);
    
    object.position.set(1215676.2153780775, -4739055.029838431, 4084137.095098698);
    
    let box = new THREE.Box3();
    
    box.expandByObject(object);
    
    //console.log(box)
    
    let sphere = new THREE.Sphere()
    
    box.getBoundingSphere(sphere);
    
    //console.log(sphere)
    
    
})
*/

console.log(scene)

/*tileset.readyPromise.then((value => {
    console.log(value)
}))*/

//console.log(tileset.readyPromise)

document.querySelector("#move").onclick = ()=>{
    console.log("aaa")
    //camera.position.set(0, 0, 10);
    
    console.log(camera.position)
    
}















