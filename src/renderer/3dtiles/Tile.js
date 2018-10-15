import * as THREE from 'three'
import {defined} from "../../core/defined";
import B3DMLoader from "../loaders/B3DMLoader";
import {defaultValue} from "../../core/defaultValue";
import {deprecationWarning} from "../../core/deprecationWarning";
import {Cesium3DTileRefine} from "../../scene/Cesium3DTileRefine";

const b3dmLoader = new B3DMLoader();

function getBox(volume, inverseTileTransform) {
    if (volume.region) {
        const region = volume.region;
        const extent = new Extent('EPSG:4326', MathExtended.radToDeg(region[0]), MathExtended.radToDeg(region[2]), MathExtended.radToDeg(region[1]), MathExtended.radToDeg(region[3]));
        const box = OBB.extentToOBB(extent, region[4], region[5]);
        // update position
        box.position.add(extent.center().as('EPSG:4978').xyz());
        // compute box.matrix from box.position/rotation.
        box.updateMatrix();
        // at this point box.matrix = box.epsg4978_from_local, so
        // we transform it in parent_from_local by using parent's epsg4978_from_local
        // which from our point of view is epsg4978_from_parent.
        // box.matrix = (epsg4978_from_parent ^ -1) * epsg4978_from_local
        //            =  parent_from_epsg4978 * epsg4978_from_local
        //            =  parent_from_local
        box.matrix.premultiply(inverseTileTransform);
        // update position, rotation and scale
        box.matrix.decompose(box.position, box.quaternion, box.scale);
        return { region: box };
    } else if (volume.box) {
        // TODO: only works for axis aligned boxes
        const box = volume.box;
        // box[0], box[1], box[2] = center of the box
        // box[3], box[4], box[5] = x axis direction and half-length
        // box[6], box[7], box[8] = y axis direction and half-length
        // box[9], box[10], box[11] = z axis direction and half-length
        const center = new THREE.Vector3(box[0], box[1], box[2]);
        const w = center.x - box[3];
        const e = center.x + box[3];
        const s = center.y - box[7];
        const n = center.y + box[7];
        const b = center.z - box[11];
        const t = center.z + box[11];

        return { box: new THREE.Box3(new THREE.Vector3(w, s, b), new THREE.Vector3(e, n, t)) };
    } else if (volume.sphere) {
        const sphere = new THREE.Sphere(new THREE.Vector3(volume.sphere[0], volume.sphere[1], volume.sphere[2]), volume.sphere[3]);
        return { sphere };
    }
}

/**
 * 创建一个单独的瓦片
 */
export default class Tile extends THREE.Object3D{

    constructor(tileset, baseResource, header, parent){

        super();

        this._tileset = tileset;

        this._header = header;

        let contentHeader = header.content;

        this.viewerRequestVolume = header.viewerRequestVolume;

        this.transform = header.transform ? (new THREE.Matrix4()).fromArray(header.transform) : new THREE.Matrix4();

        this.applyMatrix(this.transform);

        this.geometricError = header.geometricError;

        this.parentFromLocalTransform = this.transform;

        this.worldFromLocalTransform = new THREE.Matrix4().multiplyMatrices(parent ? parent.worldFromLocalTransform : new THREE.Matrix4(), this.parentFromLocalTransform);

        const m = new THREE.Matrix4();
        m.getInverse(this.worldFromLocalTransform);

        //viewerRequestVolume:在进行渲染之前，viewerRequestVolume必须包含在视景体中
        this.viewerRequestVolume = header.viewerRequestVolume ? getBox(header.viewerRequestVolume, m) : undefined;


        this.boundingVolume = getBox(header.boundingVolume, m);
        if (this.boundingVolume.region) {
            this.add(this.boundingVolume.region);
        }
        //更新世界矩阵
        this.updateMatrixWorld();

        //当前瓦片是否已加载
        this._ready = false;

        //保存加载后的gltf模型数据
        this.gltf = null;

        this.geometricError = header.geometricError;

        if (!defined(this.geometricError)) {
            this.geometricError = defined(parent) ? parent.geometricError : tileset._geometricError;
            Tile._deprecationWarning('geometricErrorUndefined', 'Required property geometricError is undefined for this tile. Using parent\'s geometric error instead.');
        }

        let refine;
        if(defined(header.refine)){
            if(header.refine === 'replace' || header.refine === 'add'){
                Tile._deprecationWarning('lowercase-refine', 'This tile uses a lowercase refine "' + header.refine + '". Instead use "' + header.refine.toUpperCase() + '".');
            }
            refine = (header.refine.toUpperCase() === 'REPLACE') ? Cesium3DTileRefine.REPLACE : Cesium3DTileRefine.ADD;
        } else if( defined(parent)){
            refine = parent.refine;
        } else {
            refine = Cesium3DTileRefine.REPLACE;
        }

        /**
         * 瓦片的更新模式
         * @type {Cesium3DTileRefine}
         * @readonly
         * @private
         */
        this.refine = refine;

        this.childrenTile = [];

        this.parentTile = parent;

        /**
         *
         * @type {number}
         * @private
         */
        this._depth = 0;



    }

    load(){
        return new Promise((resolve, reject) => {
            b3dmLoader.load({url: this._url}).then(result=>{

                this.gltf = result.gltf;

                this._ready = true;

                result.gltf.scene.traverse(child=>{

                    if(!defined(child.isMesh)) return;

                    child.frustumCulled = false;

                    child.material = new THREE.MeshLambertMaterial(0xffffff);

                });

                this.add(result.gltf.scene);

                resolve(result)
            })
        })


    }

    get ready(){
        return this._ready
    }
}

Tile._deprecationWarning = deprecationWarning;
