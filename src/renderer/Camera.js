import * as THREE from 'three'
import {defaultValue} from "../core/defaultValue";
import {defined} from "../core/defined";
import {pre3dTilesUpdate} from "../core/pre3dTilesUpdate";
import Event from "../core/Event";

const tmp = {
    frustum: new THREE.Frustum(),
    matrix: new THREE.Matrix4(),
    box3: new THREE.Box3(),
};

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


}
