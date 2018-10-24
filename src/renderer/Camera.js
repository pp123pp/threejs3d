import * as THREE from 'three'
import {defaultValue} from "../core/defaultValue";
import {defined} from "../core/defined";
import {pre3dTilesUpdate} from "../core/pre3dTilesUpdate";
import Event from "../core/Event";
import DeveloperError from "../core/DeveloperError";

const tmp = {
    frustum: new THREE.Frustum(),
    matrix: new THREE.Matrix4(),
    box3: new THREE.Box3(),
};

let dir = new THREE.Vector3();

function update(camera) {
/*    //>>includeStart('debug', pragmas.debug);
    if (!defined(camera.fov) || !defined(camera.aspect) || !defined(camera.near) || !defined(camera.far)) {
        throw new DeveloperError('fov, aspect, near, or far parameters are not set.');
    }
    //>>includeEnd('debug');
    
    camera._fovy = (camera.aspect <= 1) ? camera.fov : Math.atan(Math.tan(camera.fov * 0.5) / camera.aspect) * 2.0;
    
    camera._sseDenominator = 2.0 * Math.tan(0.5 * camera._fovy);*/
    
    // pre-sse
    //勾股定理，求屏幕对角线的长度
    const hypotenuse = Math.sqrt(camera.containerWidth * camera.containerWidth + camera.containerHeight * camera.containerHeight);
    //相机的观察角度
    const radAngle = camera.fov * Math.PI / 180;
    
    //SSE用来判定HLOD细化，即，一个瓦片在当前视图是否足够精细，它的子瓦片是否需要考虑。
    //SSE：屏幕空间误差，计算公式：http://www.cjig.cn/html/jig/2018/7/20180714.htm
    // TODO: not correct -> see new preSSE
    // const HFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) / context.camera.ratio);
    const HYFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) * hypotenuse / camera.containerWidth);
    camera._sseDenominator = (2.0 * Math.tan(HYFOV * 0.5));
    
}

export default class Camera extends THREE.PerspectiveCamera{

    constructor( options = {}){

        let fov = defaultValue(options.fov, 60);

        let aspect = defaultValue(options.aspect, window.innerWidth/window.innerHeight);

        let near = defaultValue(options.near, 0.1);

        let far = defaultValue(options.far, 500000000);

        super(fov, aspect, near, far);

        //当前相机的视图矩阵
        this._viewMatrix = new THREE.Matrix4();

        //当前渲染场景的宽
        this.containerWidth = null;

        //当前渲染场景的高
        this.containerHeight = null;

        //屏幕空间误差
        this.preSSE = null;

        this.lastFramePs = new THREE.Vector3().copy(this.position);

        this._changed = new Event();
        this._changedPosition = undefined;
        this._changedDirection = undefined;

        /**
         * The amount the camera has to change before the <code>changed</code> event is raised. The value is a percentage in the [0, 1] range.
         * @type {number}
         * @default 0.5
         */
        this.percentageChanged = 0.5;
        
        this._fovy = undefined;
        
        this._sseDenominator = undefined;

    }



    resize(container){

        let [containerWidth,containerHeight ] = [ container.clientWidth, container.clientHeight];

        this.aspect = containerWidth/containerHeight;

        this.updateProjectionMatrix();

        this.containerWidth = containerWidth;

        this.containerHeight = containerHeight;

    }

    _updateCameraChanged(){
        let camera = this;

        if(camera._changed.numberOfListeners === 0){
            return;
        }

        var percentageChanged = camera.percentageChanged;

        if (!defined(camera._changedDirection)) {
            camera._changedPosition = new THREE.Vector3().copy(camera.position);
            camera._changedDirection = camera.getWorldDirection(new THREE.Vector3());
            return;
        }
    }

    /**
     * 判断当前包围盒是否可见
     * @param box3 {Box3} 该包围盒对象
     * @param matrixWorld {Matrix4} 包围盒的偏移矩阵
     */
    isBox3Visible(box3, matrixWorld){
        if(defined(matrixWorld)){
            //获得该包围盒的世界矩阵
            tmp.matrix.multiplyMatrices(this._viewMatrix, matrixWorld);

            //构建视椎体
            tmp.frustum.setFromMatrix(tmp.matrix);
        } else {
            tmp.frustum.setFromMatrix(this._viewMatrix);
        }

        //视椎判断
        return tmp.frustum.intersectBox(box3)
    }

    isSphereVisible(sphere, matrixWorld){
        if (matrixWorld) {
            tmp.matrix.multiplyMatrices(this._viewMatrix, matrixWorld);
            tmp.frustum.setFromMatrix(tmp.matrix);
        } else {
            tmp.frustum.setFromMatrix(this._viewMatrix);
        }
        return tmp.frustum.intersectsSphere(sphere);
    }

    get sseDenominator(){
        update(this);
        return this._sseDenominator;
    }
    
    get worldDirection(){
        this.getWorldDirection(dir);
        return dir.normalize()
    }

}
