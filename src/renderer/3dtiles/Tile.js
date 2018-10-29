import * as THREE from 'three'
import * as when from './../../ThirdParty/when'
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
import {Cesium3DTileOptimizationHint} from "../../scene/Cesium3DTileOptimizationHint";
import JulianDate from "../../core/JulianDate";
import {RequestType} from "../../core/RequestType";
import Request from "../../core/Request";
import Fetcher from "../../core/Scheduler/Providers/Fetcher";
import {Cesium3DTileContentFactory} from "../../scene/Cesium3DTileContentFactory";
import {getMagic} from "../../core/getMagic";

const b3dmLoader = new B3DMLoader();

let scratchCommandList = [];

let scratchMatrix = new THREE.Matrix3();
let scratchScale = new THREE.Vector3();
let scratchHalfAxes = new THREE.Matrix3();
let scratchCenter = new THREE.Vector3();
let scratchTransform = new THREE.Matrix4();

let scratchJulianDate = new JulianDate();

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

function createPriorityFunction(tile) {
    return function() {
        return tile._priority;
    };
}

function getContentFailedFunction(tile) {
    return function(error) {
        tile._contentState = Cesium3DTileContentState.FAILED;
        tile._contentReadyPromise.reject(error);
        tile._contentReadyToProcessPromise.reject(error);
    };
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

        let viewerRequestVolume;
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
         * When <code>true</code>, the tile has no content.
         *
         * @type {Boolean}
         * @readonly
         *
         * @private
         */
        this.hasEmptyContent = hasEmptyContent;
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


        let expire = header.expire;
        let expireDuration;
        let expireDate;
        if (defined(expire)) {
            expireDuration = expire.duration;
            if (defined(expire.date)) {
                expireDate = JulianDate.fromIso8601(expire.date);
            }
        }

        this.expireDuration = expireDuration;

        this.expireDate = expireDate;

        this._optimChildrenWithinParent = Cesium3DTileOptimizationHint.NOT_COMPUTED;

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
    
        this._updatedVisibilityFrame = 0;
    }

    /*load(){
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

    }*/

    updateExpiration(){
        if (defined(this.expireDate) && this.contentReady && !this.hasEmptyContent) {
            let now = JulianDate.now(scratchJulianDate);
            if (JulianDate.lessThan(this.expireDate, now)) {
                this._contentState = Cesium3DTileContentState.EXPIRED;
                this._expiredContent = this._content;
            }
        }
    }

    contentVisibility(frameState){

    }

    requestContent(){
        let that = this;
        let tileset = this._tileset;
    
        if (this.hasEmptyContent) {
            return false;
        }
    
        let resource = this._contentResource.clone();
        let expired = this.contentExpired;
        if (expired) {
            // Append a query parameter of the tile expiration date to prevent caching
            resource.setQueryParameters({
                expired: this.expireDate.toString()
            });
        }
    
        let request = new Request({
            throttle : true,
            throttleByServer : true,
            type : RequestType.TILES3D,
            priorityFunction : createPriorityFunction(this),
            serverKey : this._serverKey
        });
        
        
        resource.request = request;
    
        let promise = resource.fetchArrayBuffer();
    
        if (!defined(promise)) {
            return false;
        }
    
        let contentState = this._contentState;
        this._contentState = Cesium3DTileContentState.LOADING;
        this._contentReadyToProcessPromise = when.defer();
        this._contentReadyPromise = when.defer();
    
        if (expired) {
            this.expireDate = undefined;
        }
    
        let contentFailedFunction = getContentFailedFunction(this);
    
        
        /*myResource.fetchArrayBuffer().then(arrayBuffer=>{
            console.log(arrayBuffer)
        });*/
    
        promise.then(function(arrayBuffer) {
            
            console.log(arrayBuffer)
            
            //如果当前瓦片已经卸载(卸载不可用)
            if (that.isDestroyed()) {
                // Tile is unloaded before the content finishes loading
                contentFailedFunction();
                return;
            }
            let uint8Array = new Uint8Array(arrayBuffer);
            //获取当前模型头，是b3dm还是点云
            let magic = getMagic(uint8Array);
            //根据头部，选取不同的解析方法
            let contentFactory = Cesium3DTileContentFactory[magic];
            let content;
        
            // Vector and Geometry tile rendering do not support the skip LOD optimization.
            tileset._disableSkipLevelOfDetail = tileset._disableSkipLevelOfDetail || magic === 'vctr' || magic === 'geom';
        
            //如果有对应的解析方法
            if (defined(contentFactory)) {
                content = contentFactory(tileset, that, that._contentResource, arrayBuffer, 0);
            } else {
                // The content may be json instead
                content = Cesium3DTileContentFactory.json(tileset, that, that._contentResource, arrayBuffer, 0);
                that.hasTilesetContent = true;
            }
        
            //将content与tile进行绑定
            that._content = content;
            
            //更新当前Tile状态，数据以获取但未解析
            that._contentState = Cesium3DTileContentState.PROCESSING;
            that._contentReadyToProcessPromise.resolve(content);
        
            //当模型加载完后
            return content.readyPromise.then(function(content) {
                if (that.isDestroyed()) {
                    contentFailedFunction();
                    return;
                }
                that._selectedFrame = 0;
                that.lastStyleTime = 0;
            
                //更新当前tile状态，数据已解析，准备渲染至场景中
                that._contentState = Cesium3DTileContentState.READY;
                that._contentReadyPromise.resolve(content);
            });
        }).otherwise(function(error) {
            if (request.state === RequestState.CANCELLED) {
                // Cancelled due to low priority - try again later.
                that._contentState = contentState;
                --tileset.statistics.numberOfPendingRequests;
                ++tileset.statistics.numberOfAttemptedRequests;
                return;
            }
            contentFailedFunction(error);
        });
    
        return true;
    
/*        promise.then(function(arrayBuffer) {
            if (that.isDestroyed()) {
                // Tile is unloaded before the content finishes loading
                contentFailedFunction();
                return;
            }
            
            console.log(arrayBuffer)
            
            let uint8Array = new Uint8Array(arrayBuffer);
            let magic = getMagic(uint8Array);
            let contentFactory = Cesium3DTileContentFactory[magic];
            let content;

            // Vector and Geometry tile rendering do not support the skip LOD optimization.
            tileset._disableSkipLevelOfDetail = tileset._disableSkipLevelOfDetail || magic === 'vctr' || magic === 'geom';

            if (defined(contentFactory)) {
                content = contentFactory(tileset, that, that._contentResource, arrayBuffer, 0);
            } else {
                // The content may be json instead
                content = Cesium3DTileContentFactory.json(tileset, that, that._contentResource, arrayBuffer, 0);
                that.hasTilesetContent = true;
            }

            that._content = content;
            that._contentState = Cesium3DTileContentState.PROCESSING;
            that._contentReadyToProcessPromise.resolve(content);

            let aaa = content.readyPromise.then(function(content) {
                if (that.isDestroyed()) {
                    // Tile is unloaded before the content finishes processing
                    contentFailedFunction();
                    return;
                }
                //updateExpireDate(that);
    
                // Refresh style for expired content
                that._selectedFrame = 0;
                that.lastStyleTime = 0;
    
                that._contentState = Cesium3DTileContentState.READY;
                that._contentReadyPromise.resolve(content);
            })
            
            return aaa;
        }).otherwise(function(error) {
            if (request.state === RequestState.CANCELLED) {
                // Cancelled due to low priority - try again later.
                that._contentState = contentState;
                --tileset.statistics.numberOfPendingRequests;
                ++tileset.statistics.numberOfAttemptedRequests;
                return;
            }
            contentFailedFunction(error);
        });*/

        return true;
    }

    visibility(frameState, parentVisibilityPlaneMask){
        let cullingVolume = frameState.cullingVolume;
        let boundingVolume = getBoundingVolume(this, frameState);

        let tileset = this._tileset;
        let clippingPlanes = tileset.clippingPlanes;
/*        if (defined(clippingPlanes) && clippingPlanes.enabled) {
            let tileTransform = tileset.root.computedTransform;
            let intersection = clippingPlanes.computeIntersectionWithBoundingVolume(boundingVolume, tileTransform);
            this._isClipped = intersection !== Intersect.INSIDE;
            if (intersection === Intersect.OUTSIDE) {
                return CullingVolume.MASK_OUTSIDE;
            }
        }*/

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
        let boundingVolume = getBoundingVolume(this, frameState);
        return boundingVolume.distanceToCamera(frameState);
    }
    
    /**
     * 计算包围体中心与相机之间的距离
     * @param frameState
     * @return {number}
     */
    distanceToTileCenter(frameState){
        let tileBoundingVolume = getBoundingVolume(this, frameState);
        let boundingVolume = tileBoundingVolume.boundingVolume; // Gets the underlying OrientedBoundingBox or BoundingSphere
        let toCenter = new THREE.Vector3().subVectors(boundingVolume.center, frameState.camera.position);
        let distance = toCenter.length();
        toCenter.divideScalar(distance);
        let dot = frameState.camera.worldDirection.dot(toCenter);
        return distance * dot;
    }

    insideViewerRequestVolume(frameState){
        let viewerRequestVolume = this._viewerRequestVolume;
        return !defined(viewerRequestVolume) || (viewerRequestVolume.distanceToCamera(frameState) === 0.0);
    }
    
    unloadContent(){
        if (this.hasEmptyContent || this.hasTilesetContent) {
            return;
        }
    
        this._content = this._content && this._content.destroy();
        this._contentState = Cesium3DTileContentState.UNLOADED;
        this._contentReadyToProcessPromise = undefined;
        this._contentReadyPromise = undefined;
    
        this.lastStyleTime = 0;
        this.clippingPlanesDirty = (this._clippingPlanesState === 0);
        this._clippingPlanesState = 0;
    
        this._debugColorizeTiles = false;
    
        this._debugBoundingVolume = this._debugBoundingVolume && this._debugBoundingVolume.destroy();
        this._debugContentBoundingVolume = this._debugContentBoundingVolume && this._debugContentBoundingVolume.destroy();
        this._debugViewerRequestVolume = this._debugViewerRequestVolume && this._debugViewerRequestVolume.destroy();
    }
    
    process(tileset, frameState){
        let savedCommandList = frameState.commandList;
        frameState.commandList = scratchCommandList;
    
        this._content.update(tileset, frameState);
    
        scratchCommandList.length = 0;
        frameState.commandList = savedCommandList;
    }
    
    isDestroyed(){
        return false;
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

    get contentUnloaded(){
        return this._contentState === Cesium3DTileContentState.UNLOADED;
    }

    get contentReadyToProcessPromise(){
        if (defined(this._contentReadyToProcessPromise)) {
            return this._contentReadyToProcessPromise.promise;
        }
    }

    get contentReadyPromise(){
        if (defined(this._contentReadyPromise)) {
            return this._contentReadyPromise.promise;
        }
    }
    
    get content(){
        return this._content;
    }
}

Tile._deprecationWarning = deprecationWarning;
