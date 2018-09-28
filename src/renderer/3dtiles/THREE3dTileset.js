import * as THREE from 'three';
import {defined} from "../../core/defined";
import './../ThreeExtended/Extension'
import Fetcher from "../../core/Scheduler/Providers/Fetcher";
import {defaultValue} from "../../core/defaultValue";
import THREE3dTile from "./THREE3dTile";


function tilesetJsonIndex(tileset, baseUrl) {
    let counter = 0;
    this.index = {};

    function recurse(node, baseURL) {
        //this
    }
}


export default class THREE3dTileset extends THREE.Object3D{
    constructor(options = {}){

        super();

        let url = options.url;

        if(!defined(url)) {throw "options.url不能为空"}

        this.sseThreshold = defaultValue(options.sseThreshold, 16);

        this.tileset = null;

        this.tileIndex = {
            index: {}
        };

        this.asset = null;

        this.three3dTiles = [];

        let scope = this;

        this.currentModel = null;

    }

    static tilesetModelFromJson(options = {}){

        let url = options.url;

        if(!defined(url)){throw 'url不存在'}

        let three3dTileset = new THREE3dTileset(options);

        Fetcher.json(url, {}).then(tileset=>{

            three3dTileset.tileset = tileset;

            const urlPrefix = url.slice(0, url.lastIndexOf('/') + 1);

            three3dTileset.tilesetJsonIndex(tileset, urlPrefix);

            //加载模型根节点
            let root = three3dTileset.tileIndex.index[0];

            console.log(three3dTileset.tileIndex)

            //此时根节点并没有父节点
            let tile = new THREE3dTile({
                url: root.baseUrl + root.content.url,
                tileId: root.tileId,
                node: root
            });

            tile.load().then(()=>{
                tile.position.set(0, 0, 0);
                tile.updateMatrixWorld()
            });

            //tile.visible = false

            three3dTileset.three3dTiles.push(tile);

            three3dTileset.add(tile);

            three3dTileset.three3dTiles.push(tile);

            three3dTileset.currentModel = tile

        });

        return three3dTileset

    }


    tilesetJsonIndex(tileset, baseUrl){

        let counter = 0;
        let index = this.tileIndex.index;

        recurse(tileset.root, baseUrl);

        function recurse(node, baseUrl) {

            index[counter] = node;
            node.tileId = counter;
            node.baseUrl = baseUrl;
            counter ++;

            if(defined(node.children)){
                for (const child of node.children) {
                    recurse(child, baseUrl);
                }
            }

        }

    }

    changeEvent(camera){
        /*if(this.three3dTiles.length === 0) return;
        const sse = this.computeNodeSSE(camera, this.currentModel);

        //console.log(sse)

        if(sse > this.sseThreshold){
            //console.log("变换模型")

            let index = this.tileIndex.index[this.currentModel.tileId].children[0];

            let tile = new THREE3dTile({
                url: index.baseUrl + index.content.url,
                tileId: index.tileId,
                node: index,
                parent: this.currentModel
            });

            tile.load().then(()=>{
                //tile.position.set(0, 0, 0);
                tile.updateMatrixWorld();
                tile.parentNode.visible = false;
            });

            tile.applyMatrix(this.currentModel.matrixWorld);
            tile.updateMatrixWorld();

            this.add(tile);

            this.three3dTiles.push(tile);

            this.currentModel = tile

        }*/
    }

    computeNodeSSE(camera, node){
        if (node.boundingVolume.region) {
            const cameraLocalPosition = camera.position.clone();
            cameraLocalPosition.x -= node.boundingVolume.region.matrixWorld.elements[12];
            cameraLocalPosition.y -= node.boundingVolume.region.matrixWorld.elements[13];
            cameraLocalPosition.z -= node.boundingVolume.region.matrixWorld.elements[14];
            const distance = node.boundingVolume.region.box3D.distanceToPoint(cameraLocalPosition);
            return camera.preSSE * (node.geometricError / distance);
        }
        if (node.boundingVolume.box) {
            const cameraLocalPosition = camera.position.clone();
            cameraLocalPosition.x -= node.matrixWorld.elements[12];
            cameraLocalPosition.y -= node.matrixWorld.elements[13];
            cameraLocalPosition.z -= node.matrixWorld.elements[14];
            const distance = node.boundingVolume.box.distanceToPoint(cameraLocalPosition);
            return camera.preSSE * (node.geometricError / distance);
        }
        if (node.boundingVolume.sphere) {
            const cameraLocalPosition = camera.position.clone();
            cameraLocalPosition.x -= node.matrixWorld.elements[12];
            cameraLocalPosition.y -= node.matrixWorld.elements[13];
            cameraLocalPosition.z -= node.matrixWorld.elements[14];
            const distance = node.boundingVolume.sphere.distanceToPoint(cameraLocalPosition);
            return camera.preSSE * (node.geometricError / distance);
        }
        return Infinity;
    }

    mainLoopUpdate(context){

    }
}
