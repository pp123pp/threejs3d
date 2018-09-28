import * as THREE from 'three'
import {defined} from "../../core/defined";
import {defaultValue} from "../../core/defaultValue";
import Fetcher from "../../core/Scheduler/Providers/Fetcher";
import {RuntimeError} from "../../core/RuntimeError";
import THREE3dTile from "./THREE3dTile";


export default class Tileset extends THREE.Object3D{
    constructor(options = {}) {
        super();

        this.sseThreshold = defaultValue(options.sseThreshold, 16);

        this.fileUrl = options.url;

        //当前根节点
        this.rootNode = null;

        //保存json文件数据
        this.tilesetJson = null;

    }

    static fromJson(options={}){

        let url = options.url;

        if(!defined(url)) {throw "options.url参数不能为空!"}

        let tileset = new Tileset(options);

        Fetcher.json(url, {}).then(tilesetJson=>{
              
            this.tilesetJson = tilesetJson;

            const urlPrefix = url.slice(0, url.lastIndexOf('/') + 1);

            console.log(tilesetJson)

            let asset = tilesetJson.asset;
            if(!defined(asset)){
                throw new RuntimeError('Tileset must have an asset property.')
            }

            if (asset.version !== '0.0' && asset.version !== '1.0') {
                throw new RuntimeError('The tileset must be 3D Tiles version 0.0 or 1.0.');
            }

            let rootTile = new THREE3dTile()

        })


    }

}
