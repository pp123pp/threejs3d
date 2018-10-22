import * as THREE from 'three'
import {defined} from "../../core/defined";
import B3DMLoader from "../loaders/B3DMLoader";
import {defaultValue} from "../../core/defaultValue";
import {deprecationWarning} from "../../core/deprecationWarning";
import {Cesium3DTileRefine} from "../../scene/Cesium3DTileRefine";
import Resource from "../../core/Resource";
import RequestScheduler from "../../core/RequestScheduler";
import {Cesium3DTileContentState} from "../../scene/Cesium3DTileContentState";
import {RuntimeError} from "../../core/RuntimeError";
import {Extension} from "../ThreeExtended/Extension";
import TileOrientedBoundingBox from "../../scene/TileOrientedBoundingBox";
import {FrustumExtension} from "../ThreeExtended/FrustumExtension";

const b3dmLoader = new B3DMLoader();

let scratchMatrix = new THREE.Matrix3();
let scratchScale = new THREE.Vector3();
let scratchHalfAxes = new THREE.Matrix3();
let scratchCenter = new THREE.Vector3();
let scratchTransform = new THREE.Matrix4();

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


function createBox(box, transform, result) {
    let center = scratchCenter.set(box[0], box[1], box[2]);
    let halfAxes = scratchHalfAxes.fromArray(box, 3);
    
    // Find the transformed center and halfAxes
    center.applyMatrix4(transform);
    let rotationScale = THREE.Matrix4.getRotation(transform, scratchMatrix);
    halfAxes.copy(new THREE.Matrix3().multiplyMatrices(rotationScale, halfAxes))
    
    if (defined(result)) {
        result.update(center, halfAxes);
        return result;
    }
    return new TileOrientedBoundingBox(center, halfAxes);
}

function createRegion() {

}

function createSphere() {

}

function getBoundingVolume(tile, frameState) {
    
    return tile._boundingVolume;
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

        //this.viewerRequestVolume = header.viewerRequestVolume;

        this.transform = header.transform ? (new THREE.Matrix4()).fromArray(header.transform) : new THREE.Matrix4();
        
        this.applyMatrix(this.transform);
    
        let parentTransform = defined(parent) ? parent.computedTransform : tileset.matrixWorld;
    
        let computedTransform = new THREE.Matrix4().multiplyMatrices(parentTransform, this.transform);
    
        this.computedTransform = computedTransform;
    
        this._boundingVolume = this.createBoundingVolume(header.boundingVolume, computedTransform);
        //this._boundingVolume2D = undefined;
    
        var viewerRequestVolume;
        if (defined(header.viewerRequestVolume)) {
            viewerRequestVolume = this.createBoundingVolume(header.viewerRequestVolume, computedTransform);
        }
    
        this._viewerRequestVolume = viewerRequestVolume;
        
        this.geometricError = header.geometricError;

        this.parentFromLocalTransform = this.transform;

        this.worldFromLocalTransform = new THREE.Matrix4().multiplyMatrices(parent ? parent.worldFromLocalTransform : new THREE.Matrix4(), this.parentFromLocalTransform);

        const m = new THREE.Matrix4();
        m.getInverse(this.worldFromLocalTransform);

        //viewerRequestVolume:在进行渲染之前，viewerRequestVolume必须包含在视景体中
        //this.viewerRequestVolume = header.viewerRequestVolume ? getBox(header.viewerRequestVolume, m) : undefined;
    
        
        this._viewerRequestVolume = viewerRequestVolume;

        /*this._boundingVolume = getBox(header._boundingVolume, m);
        if (this._boundingVolume.region) {
            this.add(this._boundingVolume.region);
        }*/
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

        let content;
        let hasEmptyContent;
        let contentState;
        let contentResource;
        let serverKey;


        baseResource = Resource.createIfNeeded(baseResource);

        if (defined(contentHeader)) {
            let contentHeaderUri = contentHeader.uri;
            if (defined(contentHeader.url)) {
                Tile._deprecationWarning('contentUrl', 'This tileset JSON uses the "content.url" property which has been deprecated. Use "content.uri" instead.');
                contentHeaderUri = contentHeader.url;
            }
            hasEmptyContent = false;
            contentState = Cesium3DTileContentState.UNLOADED;
            contentResource = baseResource.getDerivedResource({
                url : contentHeaderUri
            });
            serverKey = RequestScheduler.getServerKey(contentResource.getUrlComponent());
        } else {
            //content = new Empty3DTileContent(tileset, this);
            //hasEmptyContent = true;
            //contentState = Cesium3DTileContentState.READY;
        }
    
        this._content = content;
        this._contentResource = contentResource;
        this._contentState = contentState;
        this._contentReadyToProcessPromise = undefined;
        this._contentReadyPromise = undefined;
        this._expiredContent = undefined;
        
        this._serverKey = serverKey;
    
        /**
         * When <code>true</code>, the tile's content points to an external tileset.
         * <p>
         * This is <code>false</code> until the tile's content is loaded.
         * </p>
         *
         * @type {Boolean}
         * @readonly
         *
         * @private
         */
        this.hasTilesetContent = false;
    
    
        var expire = header.expire;
        var expireDuration;
        var expireDate;
        if (defined(expire)) {
            expireDuration = expire.duration;
            if (defined(expire.date)) {
                expireDate = JulianDate.fromIso8601(expire.date);
            }
        }
    
        this._distanceToCamera = 0;
        this._centerZDepth = 0;
        this._screenSpaceError = 0;
        this._visibilityPlaneMask = 0;
        this._visible = false;
        this._inRequestVolume = false;
    
        this._finalResolution = true;
        this._depth = 0;
        this._stackLength = 0;
        this._selectionDepth = 0;
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
    
    contentVisibility(frameState){
    
    }
    
    requestContent(){
        var that = this;
        var tileset = this._tileset;
    
        if (this.hasEmptyContent) {
            return false;
        }
    
        var resource = this._contentResource.clone();
        var expired = this.contentExpired;
        if (expired) {
            // Append a query parameter of the tile expiration date to prevent caching
            resource.setQueryParameters({
                expired: this.expireDate.toString()
            });
        }
    }
    
    visibility(frameState, parentVisibilityPlaneMask){
        var cullingVolume = frameState.cullingVolume;
        var boundingVolume = getBoundingVolume(this, frameState);
    
        var tileset = this._tileset;
        var clippingPlanes = tileset.clippingPlanes;
        if (defined(clippingPlanes) && clippingPlanes.enabled) {
            var tileTransform = tileset.root.computedTransform;
            var intersection = clippingPlanes.computeIntersectionWithBoundingVolume(boundingVolume, tileTransform);
            this._isClipped = intersection !== Intersect.INSIDE;
            if (intersection === Intersect.OUTSIDE) {
                return CullingVolume.MASK_OUTSIDE;
            }
        }
    
        return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
    }
    
    updateTransform(parentTransform){
        parentTransform = defaultValue(parentTransform, new THREE.Matrix4());
        let computedTransform = scratchTransform.multiplyMatrices(parentTransform, this.transform);
        let transformChanged = !computedTransform.equals(this.computedTransform);
    
        if (!transformChanged) {
            return;
        }
    
        Matrix4.clone(computedTransform, this.computedTransform);
    
        // Update the bounding volumes
        let header = this._header;
        let content = this._header.content;
        this._boundingVolume = this.createBoundingVolume(header.boundingVolume, this.computedTransform, this._boundingVolume);
        if (defined(this._contentBoundingVolume)) {
            this._contentBoundingVolume = this.createBoundingVolume(content.boundingVolume, this.computedTransform, this._contentBoundingVolume);
        }
        if (defined(this._viewerRequestVolume)) {
            this._viewerRequestVolume = this.createBoundingVolume(header.viewerRequestVolume, this.computedTransform, this._viewerRequestVolume);
        }
    
        // Destroy the debug bounding volumes. They will be generated fresh.
        this._debugBoundingVolume = this._debugBoundingVolume && this._debugBoundingVolume.destroy();
        this._debugContentBoundingVolume = this._debugContentBoundingVolume && this._debugContentBoundingVolume.destroy();
        this._debugViewerRequestVolume = this._debugViewerRequestVolume && this._debugViewerRequestVolume.destroy();
    }
    
    createBoundingVolume(boundingVolumeHeader, transform, result){
        if (!defined(boundingVolumeHeader)) {
            throw new RuntimeError('boundingVolume must be defined');
        }
        if (defined(boundingVolumeHeader.box)) {
            return createBox(boundingVolumeHeader.box, transform, result);
        }
        if (defined(boundingVolumeHeader.region)) {
            return createRegion(boundingVolumeHeader.region, transform, this._initialTransform, result);
        }
        if (defined(boundingVolumeHeader.sphere)) {
            return createSphere(boundingVolumeHeader.sphere, transform, result);
        }
        throw new RuntimeError('boundingVolume must contain a sphere, region, or box');
    }
    
    distanceToTile(frameState){
        var boundingVolume = getBoundingVolume(this, frameState);
        return boundingVolume.distanceToCamera(frameState);
    }
    
    distanceToTileCenter(frameState){
        var tileBoundingVolume = getBoundingVolume(this, frameState);
        var boundingVolume = tileBoundingVolume.boundingVolume; // Gets the underlying OrientedBoundingBox or BoundingSphere
        var toCenter = new THREE.Vector3().subVectors(boundingVolume.center, frameState.camera.position);
        var distance = toCenter.length();
        toCenter.divideScalar(distance);
        var dot = frameState.camera.position.dot(toCenter);
        return distance * dot;
    }
    
    insideViewerRequestVolume(frameState){
        var viewerRequestVolume = this._viewerRequestVolume;
        return !defined(viewerRequestVolume) || (viewerRequestVolume.distanceToCamera(frameState) === 0.0);
    }
    
    get ready(){
        return this._ready
    }

    get contentReady(){
        return this._contentState === Cesium3DTileContentState.READY;
    }

    get contentAvailable(){
        return (this.contentReady && !this.hasEmptyContent && !this.hasTilesetContent) || (defined(this._expiredContent) && !this.contentFailed);
    }
    
    get boundingVolume(){
        return this._boundingVolume;
    }
    
    get contentExpired(){
        return this._contentState === Cesium3DTileContentState.EXPIRED;
    }
}

Tile._deprecationWarning = deprecationWarning;
