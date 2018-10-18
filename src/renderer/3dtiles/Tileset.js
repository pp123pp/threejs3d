import * as THREE from 'three'
import {defined} from "../../core/defined";
import {defaultValue} from "../../core/defaultValue";
import Fetcher from "../../core/Scheduler/Providers/Fetcher";
import {RuntimeError} from "../../core/RuntimeError";
import Tile from "./Tile";
import Resource from "../../core/Resource";
import Event from "../../core/Event";
import Cesium3DTilesetCache from "../../scene/Cesium3DTilesetCache";
import ManagedArray from "../../core/ManagedArray";
import Cesium3DTilesetStatistics from "../../scene/Cesium3DTilesetStatistics";
import {Cesium3DTileRefine} from "../../scene/Cesium3DTileRefine";
import {Axis} from "../../scene/Axis";


function updateDynamicScreenSpaceError(tileset) {

}


export default class Tileset extends THREE.Object3D{
    constructor(options = {}) {
        super();


        /*this.sseThreshold = defaultValue(options.sseThreshold, 16);

                this.fileUrl = options.url;

                //当前根节点
                this.rootNode = null;

                //保存json文件数据
                this.tilesetJson = null;

                this._root = undefined;
                this._asset = undefined;
                this._properties = undefined; // Metadata for per-model/point/etc properties
                this._geometricError = undefined; // Geometric error when the tree is not rendered at all

                this.tileIndex = {
                    index: {}
                }*/


        this._url = undefined;
        this._basePath = undefined;
        this._root = undefined;
        this._asset = undefined; // Metadata for the entire tileset
        this._properties = undefined; // Metadata for per-model/point/etc properties
        this._geometricError = undefined; // Geometric error when the tree is not rendered at all
        this._extensionsUsed = undefined;
        this._gltfUpAxis = undefined;
        this._cache = new Cesium3DTilesetCache();
        this._processingQueue = [];
        this._selectedTiles = [];
        this._emptyTiles = [];
        this._requestedTiles = [];
        this._selectedTilesToStyle = [];
        this._loadTimestamp = undefined;
        this._timeSinceLoad = 0.0;
        this._extras = undefined;

        this._cullWithChildrenBounds = defaultValue(options.cullWithChildrenBounds, true);
        this._allTilesAdditive = true;

        this._hasMixedContent = false;

        this._backfaceCommands = new ManagedArray();

        this._maximumScreenSpaceError = defaultValue(options.maximumScreenSpaceError, 16);
        this._maximumMemoryUsage = defaultValue(options.maximumMemoryUsage, 512);

        //this._styleEngine = new Cesium3DTileStyleEngine();

        this._modelMatrix = defined(options.modelMatrix) ? new THREE.Matrix4().clone(options.modelMatrix) : new THREE.Matrix4().identity();

        this._statistics = new Cesium3DTilesetStatistics();
        this._statisticsLastColor = new Cesium3DTilesetStatistics();
        this._statisticsLastPick = new Cesium3DTilesetStatistics();

        this._tilesLoaded = false;
        this._initialTilesLoaded = false;

        this._tileDebugLabels = undefined;

        this._readyPromise = Promise;

        this._classificationType = options.classificationType;

        //this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);

        this._useBoundingSphereForClipping = false;
        this._clippingPlaneOffsetMatrix = undefined;

        /**
         * Optimization option. Whether the tileset should refine based on a dynamic screen space error. Tiles that are further
         * away will be rendered with lower detail than closer tiles. This improves performance by rendering fewer
         * tiles and making less requests, but may result in a slight drop in visual quality for tiles in the distance.
         * The algorithm is biased towards "street views" where the camera is close to the ground plane of the tileset and looking
         * at the horizon. In addition results are more accurate for tightly fitting bounding volumes like box and region.
         *
         * @type {Boolean}
         * @default false
         */
        this.dynamicScreenSpaceError = defaultValue(options.dynamicScreenSpaceError, false);

        /**
         * A scalar that determines the density used to adjust the dynamic screen space error, similar to {@link Fog}. Increasing this
         * value has the effect of increasing the maximum screen space error for all tiles, but in a non-linear fashion.
         * The error starts at 0.0 and increases exponentially until a midpoint is reached, and then approaches 1.0 asymptotically.
         * This has the effect of keeping high detail in the closer tiles and lower detail in the further tiles, with all tiles
         * beyond a certain distance all roughly having an error of 1.0.
         * <p>
         * The dynamic error is in the range [0.0, 1.0) and is multiplied by <code>dynamicScreenSpaceErrorFactor</code> to produce the
         * final dynamic error. This dynamic error is then subtracted from the tile's actual screen space error.
         * </p>
         * <p>
         * Increasing <code>dynamicScreenSpaceErrorDensity</code> has the effect of moving the error midpoint closer to the camera.
         * It is analogous to moving fog closer to the camera.
         * </p>
         *
         * @type {Number}
         * @default 0.00278
         */
        this.dynamicScreenSpaceErrorDensity = 0.00278;

        /**
         * A factor used to increase the screen space error of tiles for dynamic screen space error. As this value increases less tiles
         * are requested for rendering and tiles in the distance will have lower detail. If set to zero, the feature will be disabled.
         *
         * @type {Number}
         * @default 4.0
         */
        this.dynamicScreenSpaceErrorFactor = 4.0;

        /**
         * A ratio of the tileset's height at which the density starts to falloff. If the camera is below this height the
         * full computed density is applied, otherwise the density falls off. This has the effect of higher density at
         * street level views.
         * <p>
         * Valid values are between 0.0 and 1.0.
         * </p>
         *
         * @type {Number}
         * @default 0.25
         */
        this.dynamicScreenSpaceErrorHeightFalloff = 0.25;

        this._dynamicScreenSpaceErrorComputedDensity = 0.0; // Updated based on the camera position and direction

        /**
         * Determines whether the tileset casts or receives shadows from each light source.
         * <p>
         * Enabling shadows has a performance impact. A tileset that casts shadows must be rendered twice, once from the camera and again from the light's point of view.
         * </p>
         * <p>
         * Shadows are rendered only when {@link Viewer#shadows} is <code>true</code>.
         * </p>
         *
         * @type {ShadowMode}
         * @default ShadowMode.ENABLED
         */
        //this.shadows = defaultValue(options.shadows, ShadowMode.ENABLED);

        /**
         * Determines if the tileset will be shown.
         *
         * @type {Boolean}
         * @default true
         */
        this.show = defaultValue(options.show, true);

        /**
         * Defines how per-feature colors set from the Cesium API or declarative styling blend with the source colors from
         * the original feature, e.g. glTF material or per-point color in the tile.
         *
         * @type {Cesium3DTileColorBlendMode}
         * @default Cesium3DTileColorBlendMode.HIGHLIGHT
         */
        //this.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;

        /**
         * Defines the value used to linearly interpolate between the source color and feature color when the {@link Cesium3DTileset#colorBlendMode} is <code>MIX</code>.
         * A value of 0.0 results in the source color while a value of 1.0 results in the feature color, with any value in-between
         * resulting in a mix of the source color and feature color.
         *
         * @type {Number}
         * @default 0.5
         */
        this.colorBlendAmount = 0.5;

        /**
         * Options for controlling point size based on geometric error and eye dome lighting.
         * @type {PointCloudShading}
         */
        //this.pointCloudShading = new PointCloudShading(options.pointCloudShading);

        //this._pointCloudEyeDomeLighting = new PointCloudEyeDomeLighting();

        /**
         * The event fired to indicate progress of loading new tiles.  This event is fired when a new tile
         * is requested, when a requested tile is finished downloading, and when a downloaded tile has been
         * processed and is ready to render.
         * <p>
         * The number of pending tile requests, <code>numberOfPendingRequests</code>, and number of tiles
         * processing, <code>numberOfTilesProcessing</code> are passed to the event listener.
         * </p>
         * <p>
         * This event is fired at the end of the frame after the scene is rendered.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.loadProgress.addEventListener(function(numberOfPendingRequests, numberOfTilesProcessing) {
         *     if ((numberOfPendingRequests === 0) && (numberOfTilesProcessing === 0)) {
         *         console.log('Stopped loading');
         *         return;
         *     }
         *
         *     console.log('Loading: requests: ' + numberOfPendingRequests + ', processing: ' + numberOfTilesProcessing);
         * });
         */
        this.loadProgress = new Event();

        /**
         * The event fired to indicate that all tiles that meet the screen space error this frame are loaded. The tileset
         * is completely loaded for this view.
         * <p>
         * This event is fired at the end of the frame after the scene is rendered.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.allTilesLoaded.addEventListener(function() {
         *     console.log('All tiles are loaded');
         * });
         *
         * @see Cesium3DTileset#tilesLoaded
         */
        this.allTilesLoaded = new Event();

        /**
         * The event fired to indicate that all tiles that meet the screen space error this frame are loaded. This event
         * is fired once when all tiles in the initial view are loaded.
         * <p>
         * This event is fired at the end of the frame after the scene is rendered.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.initialTilesLoaded.addEventListener(function() {
         *     console.log('Initial tiles are loaded');
         * });
         *
         * @see Cesium3DTileset#allTilesLoaded
         */
        this.initialTilesLoaded = new Event();

        /**
         * The event fired to indicate that a tile's content was loaded.
         * <p>
         * The loaded {@link Cesium3DTile} is passed to the event listener.
         * </p>
         * <p>
         * This event is fired during the tileset traversal while the frame is being rendered
         * so that updates to the tile take effect in the same frame.  Do not create or modify
         * Cesium entities or primitives during the event listener.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileLoad.addEventListener(function(tile) {
         *     console.log('A tile was loaded.');
         * });
         */
        this.tileLoad = new Event();

        /**
         * The event fired to indicate that a tile's content was unloaded.
         * <p>
         * The unloaded {@link Cesium3DTile} is passed to the event listener.
         * </p>
         * <p>
         * This event is fired immediately before the tile's content is unloaded while the frame is being
         * rendered so that the event listener has access to the tile's content.  Do not create
         * or modify Cesium entities or primitives during the event listener.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileUnload.addEventListener(function(tile) {
         *     console.log('A tile was unloaded from the cache.');
         * });
         *
         * @see Cesium3DTileset#maximumMemoryUsage
         * @see Cesium3DTileset#trimLoadedTiles
         */
        this.tileUnload = new Event();

        /**
         * The event fired to indicate that a tile's content failed to load.
         * <p>
         * If there are no event listeners, error messages will be logged to the console.
         * </p>
         * <p>
         * The error object passed to the listener contains two properties:
         * <ul>
         * <li><code>url</code>: the url of the failed tile.</li>
         * <li><code>message</code>: the error message.</li>
         * </ul>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileFailed.addEventListener(function(error) {
         *     console.log('An error occurred loading tile: ' + error.url);
         *     console.log('Error: ' + error.message);
         * });
         */
        this.tileFailed = new Event();

        /**
         * This event fires once for each visible tile in a frame.  This can be used to manually
         * style a tileset.
         * <p>
         * The visible {@link Cesium3DTile} is passed to the event listener.
         * </p>
         * <p>
         * This event is fired during the tileset traversal while the frame is being rendered
         * so that updates to the tile take effect in the same frame.  Do not create or modify
         * Cesium entities or primitives during the event listener.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileVisible.addEventListener(function(tile) {
         *     if (tile.content instanceof Cesium.Batched3DModel3DTileContent) {
         *         console.log('A Batched 3D Model tile is visible.');
         *     }
         * });
         *
         * @example
         * // Apply a red style and then manually set random colors for every other feature when the tile becomes visible.
         * tileset.style = new Cesium.Cesium3DTileStyle({
         *     color : 'color("red")'
         * });
         * tileset.tileVisible.addEventListener(function(tile) {
         *     let content = tile.content;
         *     let featuresLength = content.featuresLength;
         *     for (let i = 0; i < featuresLength; i+=2) {
         *         content.getFeature(i).color = Cesium.Color.fromRandom();
         *     }
         * });
         */
        this.tileVisible = new Event();

        /**
         * Optimization option. Determines if level of detail skipping should be applied during the traversal.
         * <p>
         * The common strategy for replacement-refinement traversal is to store all levels of the tree in memory and require
         * all children to be loaded before the parent can refine. With this optimization levels of the tree can be skipped
         * entirely and children can be rendered alongside their parents. The tileset requires significantly less memory when
         * using this optimization.
         * </p>
         *
         * @type {Boolean}
         * @default true
         */
        this.skipLevelOfDetail = defaultValue(options.skipLevelOfDetail, true);
        this._skipLevelOfDetail = this.skipLevelOfDetail;
        this._disableSkipLevelOfDetail = false;

        /**
         * The screen space error that must be reached before skipping levels of detail.
         * <p>
         * Only used when {@link Cesium3DTileset#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Number}
         * @default 1024
         */
        this.baseScreenSpaceError = defaultValue(options.baseScreenSpaceError, 1024);

        /**
         * Multiplier defining the minimum screen space error to skip.
         * For example, if a tile has screen space error of 100, no tiles will be loaded unless they
         * are leaves or have a screen space error <code><= 100 / skipScreenSpaceErrorFactor</code>.
         * <p>
         * Only used when {@link Cesium3DTileset#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Number}
         * @default 16
         */
        this.skipScreenSpaceErrorFactor = defaultValue(options.skipScreenSpaceErrorFactor, 16);

        /**
         * Constant defining the minimum number of levels to skip when loading tiles. When it is 0, no levels are skipped.
         * For example, if a tile is level 1, no tiles will be loaded unless they are at level greater than 2.
         * <p>
         * Only used when {@link Cesium3DTileset#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Number}
         * @default 1
         */
        this.skipLevels = defaultValue(options.skipLevels, 1);

        /**
         * When true, only tiles that meet the maximum screen space error will ever be downloaded.
         * Skipping factors are ignored and just the desired tiles are loaded.
         * <p>
         * Only used when {@link Cesium3DTileset#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.immediatelyLoadDesiredLevelOfDetail = defaultValue(options.immediatelyLoadDesiredLevelOfDetail, false);

        /**
         * Determines whether siblings of visible tiles are always downloaded during traversal.
         * This may be useful for ensuring that tiles are already available when the viewer turns left/right.
         * <p>
         * Only used when {@link Cesium3DTileset#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.loadSiblings = defaultValue(options.loadSiblings, false);

        this._clippingPlanes = undefined;
        this.clippingPlanes = options.clippingPlanes;

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * Determines if only the tiles from last frame should be used for rendering.  This
         * effectively "freezes" the tileset to the previous frame so it is possible to zoom
         * out and see what was rendered.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugFreezeFrame = defaultValue(options.debugFreezeFrame, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, assigns a random color to each tile.  This is useful for visualizing
         * what features belong to what tiles, especially with additive refinement where features
         * from parent tiles may be interleaved with features from child tiles.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugColorizeTiles = defaultValue(options.debugColorizeTiles, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders each tile's content as a wireframe.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugWireframe = defaultValue(options.debugWireframe, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders the bounding volume for each visible tile.  The bounding volume is
         * white if the tile has a content bounding volume or is empty; otherwise, it is red.  Tiles that don't meet the
         * screen space error and are still refining to their descendants are yellow.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders the bounding volume for each visible tile's content. The bounding volume is
         * blue if the tile has a content bounding volume; otherwise it is red.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowContentBoundingVolume = defaultValue(options.debugShowContentBoundingVolume, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders the viewer request volume for each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowViewerRequestVolume = defaultValue(options.debugShowViewerRequestVolume, false);

        this._tileDebugLabels = undefined;
        this.debugPickedTileLabelOnly = false;
        this.debugPickedTile = undefined;
        this.debugPickPosition = undefined;

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the geometric error of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowGeometricError = defaultValue(options.debugShowGeometricError, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the number of commands, points, triangles and features of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowRenderingStatistics = defaultValue(options.debugShowRenderingStatistics, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the geometry and texture memory usage of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowMemoryUsage = defaultValue(options.debugShowMemoryUsage, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the url of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowUrl = defaultValue(options.debugShowUrl, false);
        this._credits = undefined;

    }

    static fromJson(options={}){

        let url = options.url;

        if(!defined(url)) {throw "options.url参数不能为空!"}

        let tileset = new Tileset(options);

        /*Fetcher.json(url, {}).then(tilesetJson=>{
              
            this.tilesetJson = tilesetJson;

            const urlPrefix = url.slice(0, url.lastIndexOf('/') + 1);

            tileset.createTileJsonIndex(tilesetJson, urlPrefix);

            let asset = tilesetJson.asset;
            if(!defined(asset)){
                throw new RuntimeError('Tileset must have an asset property.')
            }

            if (asset.version !== '0.0' && asset.version !== '1.0') {
                throw new RuntimeError('The tileset must be 3D Tiles version 0.0 or 1.0.');
            }

            //let rootTile = new Tile()

        })*/

        let basePath, resource;

        resource = Resource.createIfNeeded(url);

        tileset._credits = resource._credits;


        if (resource.extension === 'json') {
            basePath = resource.getBaseUri(true);
        } else if (resource.isDataUri) {
            basePath = '';
        }

        tileset._url = resource.url;
        tileset._basePath = basePath;

        Tileset.loadJson(resource).then(tilesetJson=>{
            tileset._root = tileset.loadTileset(resource, tilesetJson)
            var gltfUpAxis = defined(tilesetJson.asset.gltfUpAxis) ? Axis.fromName(tilesetJson.asset.gltfUpAxis) : Axis.Y;
            tileset._asset = tilesetJson.asset;
            tileset._properties = tilesetJson.properties;
            tileset._geometricError = tilesetJson.geometricError;
            tileset._extensionsUsed = tilesetJson.extensionsUsed;
            tileset._gltfUpAxis = gltfUpAxis;
            tileset._extras = tilesetJson.extras;
            tileset._readyPromise.resolve(tileset)
        })

        return tileset

    }

    loadTileset(resource, tilesetJson, parentTile){
        let asset = tilesetJson.asset;
        if(!defined(asset)){
            throw new RuntimeError('Tileset must have an asset property.');
        }

        if (asset.version !== '0.0' && asset.version !== '1.0') {
            throw new RuntimeError('The tileset must be 3D Tiles version 0.0 or 1.0.');
        }

        let statistics = this._statistics;

        let tilesetVersion = asset.tilesetVersion;
        if (defined(tilesetVersion)) {
            // Append the tileset version to the resource
            this._basePath += '?v=' + tilesetVersion;
            resource.setQueryParameters({ v: tilesetVersion });
        } else {
            delete resource.queryParameters.v;
        }

        let rootTile = new Tile(this, resource, tilesetJson.root, parentTile);

        if(defined(parentTile)){
            parentTile.childrenTile.push(rootTile);
            rootTile._depth = parentTile._depth + 1;
        }


        let stack = [];
        stack.push(rootTile);

        while (stack.length > 0){
            let tile = stack.pop();
            ++statistics.numberOfTilesTotal;
            this._allTilesAdditive = this._allTilesAdditive && (tile.refine === Cesium3DTileRefine.ADD);
            let children = tile._header.children;
            if(defined(children)){
                let length = children.length;
                for (let i = 0; i < length; ++i) {
                    let childHeader = children[i];
                    let childTile = new Tile(this, resource, childHeader, tile);
                    tile.childrenTile.push(childTile);
                    childTile._depth = tile._depth + 1;
                    stack.push(childTile);
                }
            }
        }
        return rootTile

    }

    static loadJson(tilesetUrl){
        let resource = Resource.createIfNeeded(tilesetUrl);
        return resource.fetchJson()
    }

    //填充tileIndex.index对象
    createTileJsonIndex(tilesetJson, baseUrl){
        let counter = 0, index = this.tileIndex.index;

        recurse(tilesetJson.root, baseUrl);

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

    updateFixedFrame(frameState){
        if(!this.visible || !this.ready){


            let statistics = this._statistics;
            statistics.clear();

            if(this.dynamicScreenSpaceError){
                updateDynamicScreenSpaceError(this, frameState);
            }

            this._cache.reset();

            this._requestedTiles.length = 0;
            //.selectTiles(this, frameState);

        }
    }

    get readyPromise(){
        return this._readyPromise
    }

    get ready(){
        return defined(this._root)
    }

}
