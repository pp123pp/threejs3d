/**
 * 鼠标控制器
 * @param soonSpace
 * @constructor
 */

import * as THREE from 'three'
import defineProperties from "../core/defineProperties";
import {defaultValue} from "../core/defaultValue";


class EarthControls {
    constructor( soonSpace ){
        this.soonSpace = soonSpace;

        this.domElement = soonSpace.domElement;

        this.intersectObjects = [];

        this._enabled = true;

        this._enableRotate = true;

        this._enablePan = true;

        this._enableZoom = true;

        this._autoRotate = false;

        this._dbClickZoomScalar = 2;

        this._rotateCenter = new THREE.Vector3();

        this._rotateAxes = new THREE.Vector3(0, 0, 0);

        this._fadeFactor = 15;

        this._minZoomDistance = 0;

        this._maxZoomDistance = Infinity;

        this.wheelDelta = 0;

        this._maxRotateRange = Math.PI;

        this._minRotateRange = 0;

        this.zoomDelta = new THREE.Vector3();

        this.pivot = new THREE.Vector3();

        this.mouseButtons = { LEFT: THREE.MOUSE.LEFT, MIDDLE: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT };

        var scope = this;

        //鼠标控制的几种状态
        var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };

        //默认状态为none
        var state = STATE.NONE;

        var pointer = new THREE.Vector2();

        var pointerOld = new THREE.Vector2();

        /**
         * 控制器change监听事件
         * @type {{type: string}}
         */
        var changeEvent = { type: 'change' };

        /**
         * 控制器开始监听事件
         * @type {{type: string}}
         */
        var startEvent = { type: 'start' };

        /**
         * 控制器结束监听事件
         * @type {{type: string}}
         */
        var endEvent = { type: 'end' };

        var resolvedPos = new THREE.Vector3(),

            targetDir = new THREE.Vector3(),

            newPos = new THREE.Vector3();

        var camera = scope.soonSpace.camera;

        var domElement = this.domElement;

        //射线拾取
        var raycaster = new THREE.Raycaster();

        //当前鼠标的NDC坐标
        var mouse = new THREE.Vector2();

        //当前选中点
        var selectPoint = null;

        var prevDistance = null;

        var distance = null;

        var touches = [new THREE.Vector2(), new THREE.Vector2()];

        var clock = new THREE.Clock();

        /*scope.soonSpace.addEventListener('preUpdate', function () {
            scope.update(clock.getDelta())
        })*/

        this.update = function (delta) {

            if(scope._autoRotate){
                handleMouseMoveRotate(scope._rotateAxes, scope._rotateCenter)
            }

            if(this._enabled === false) return;

            var fade = Math.pow(0.5, scope._fadeFactor * delta);

            var progression = 1 - fade;

            // 计算缩放
            if(scope.wheelDelta !== 0){
                //相交测试
                selectPoint = getIntersectPoint(mouse);

                if(!selectPoint) return;

                resolvedPos.addVectors(camera.position, scope.zoomDelta);

                var distance = selectPoint.distanceTo(resolvedPos);

                //计算移动距离
                var jumpDistance = distance * 0.2 * scope.wheelDelta;

                jumpDistance = ((jumpDistance>0 && jumpDistance<scope._minZoomDistance) || jumpDistance<-scope._maxZoomDistance) ? 0 : jumpDistance

                //方向
                targetDir.subVectors(selectPoint, camera.position);

                targetDir.normalize();

                resolvedPos.add(targetDir.multiplyScalar(jumpDistance));

                scope.zoomDelta.subVectors(resolvedPos, camera.position);

            }

            if(scope.zoomDelta.length() !== 0){

                var p = scope.zoomDelta.clone().multiplyScalar(progression);

                if(p.length() > 0.01){
                    newPos.addVectors(camera.position, p);

                    camera.position.copy(newPos);

                    camera.updateMatrix();

                    camera.updateMatrixWorld();

                    scope.dispatchEvent(changeEvent)

                }

            }

            //缩放步长
            scope.zoomDelta.multiplyScalar(fade);

            scope.wheelDelta = 0;

        };


        /**
         * 移除该鼠标控制器
         * @memberOf EarthControls.prototype
         * @method dispose
         */
        this.dispose =  function () {
            scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
            scope.domElement.removeEventListener('mousewheel', onMouseWheel, false);
            scope.domElement.removeEventListener('mousemove', onMouseMove, false);
            scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
            scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
            scope.domElement.removeEventListener("dblclick", onDbClick, false);

            scope.domElement.removeEventListener( 'touchstart', touchStart, false );
            scope.domElement.removeEventListener( 'touchmove', touchMove, false );
            scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
        };


        //鼠标左键点击旋转事件
        function handleMouseDownRotate(event) {

        }

        //鼠标滚轮事件
        function handleMouseDownZoom() {

        }

        function handleMouseDownPan(event) {

        }

        function handleMouseMovePan(event, ndcMouse) {

            var vector = new THREE.Vector3( ndcMouse.x, ndcMouse.y, 0.5 );

            camera.updateMatrixWorld();

            vector.unproject(camera);

            var dir = vector.sub( camera.position).normalize();

            var ray = new THREE.Ray(camera.position, dir);

            //构建平移平面
            var plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), scope.pivot);

            var distanceToPlane = ray.distanceToPlane(plane);

            //计算平移步长
            if(distanceToPlane > 0){

                var I = new THREE.Vector3().addVectors(
                    camera.position,
                    dir.clone().multiplyScalar(distanceToPlane));

                var movedBy = new THREE.Vector3().subVectors(I, scope.pivot);

                var newCamPos = camera.position.clone().sub(movedBy);

                camera.position.copy(newCamPos);

            }

            scope.dispatchEvent(changeEvent);
        }

        var vector = new THREE.Vector3();

        function handleMouseMoveRotate(delta, rotateCenter) {

            //当自动旋转时，固定旋转中心
            if(scope._autoRotate){
                rotateCenter.copy(scope._rotateCenter)
            }

            var lookAtVector = new THREE.Vector3(0, 0, -1);

            lookAtVector.applyQuaternion(camera.quaternion);

            var angle = lookAtVector.angleTo(new THREE.Vector3(0, 1, 0));

            if ( scope._maxRotateRange < angle - delta.y ) {
                delta.y = 0;
            }

            else if (  angle - delta.y < scope._minRotateRange ) {
                delta.y = 0;
            }

            vector.copy(camera.position).sub(rotateCenter);

            var rotWorldMatrix1 = new THREE.Matrix4();

            rotWorldMatrix1.makeRotationAxis(new THREE.Vector3(0, 1, 0), delta.x);

            var localX = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);

            var rotWorldMatrix2 = new THREE.Matrix4();

            rotWorldMatrix2.makeRotationAxis(localX, delta.y);

            rotWorldMatrix1.multiply(rotWorldMatrix2);

            vector.applyMatrix4(rotWorldMatrix1);

            camera.position.copy(rotateCenter).add(vector);

            lookAtVector.applyMatrix4(rotWorldMatrix1);

            camera.lookAt(lookAtVector.add(camera.position));

            scope.dispatchEvent(changeEvent);

        }

        function onMouseWheel(event) {

            //屏蔽默认事件
            event.preventDefault();

            if(scope._enabled === false || scope._enableZoom === false) {return null}

            scope.wheelDelta = selectPoint ? Math.sign(defaultValue(event.wheelDelta, -event.detail)) : 0;

            //scope.dispatchEvent(changeEvent)

        }

        function onMouseMove(event){

            if(scope._enabled === false) {return null}

            mouse.set(event.clientX, event.clientY);

            selectPoint = getIntersectPoint(mouse);

            pointer.set( event.clientX, event.clientY );

            var movementX = pointer.x - pointerOld.x;

            var movementY = pointer.y - pointerOld.y;

            if(!selectPoint) return;

            switch (state){

                case STATE.PAN:
                    var ndcMouse =  {
                        x: (event.clientX / domElement.clientWidth ) * 2 - 1,
                        y: - (event.clientY / domElement.clientHeight ) * 2 + 1
                    };

                    handleMouseMovePan(event, ndcMouse);


                    break;

                case STATE.ROTATE:

                    handleMouseMoveRotate( new THREE.Vector3( - movementX * 0.005, - movementY * 0.005, 0 ), scope.pivot);

                    break;
            }

            pointerOld.set( event.clientX, event.clientY );

        }

        function onMouseDown(event){

            if ( scope._enabled === false ) {return null}

            event.preventDefault();

            mouse.set(event.clientX, event.clientY);

            selectPoint = getIntersectPoint(mouse);

            if(!selectPoint) return;

            scope.pivot.copy(selectPoint);

            pointerOld.set( event.clientX, event.clientY );

            switch (event.button){

                case scope.mouseButtons.LEFT:

                    if(scope._enableRotate === false) return;

                    handleMouseDownRotate(event);

                    //当前状态更新为旋转
                    state = STATE.ROTATE;

                    break;

                case scope.mouseButtons.MIDDLE:

                    if(scope._enableZoom === false) return;

                    state = STATE.ZOOM;

                    break;

                case scope.mouseButtons.RIGHT:

                    if(scope._enablePan === false) return;

                    handleMouseDownPan(event);

                    state = STATE.PAN;

            }

            scope.dispatchEvent(startEvent);

        }

        function onMouseUp(){

            if ( scope._enabled === false ) return;

            state = STATE.NONE;

            scope.dispatchEvent(endEvent);
        }

        function onDbClick(){

            scope.wheelDelta = scope._dbClickZoomScalar;

        }

        function onContextMenu(event){

            if ( scope.enabled === false ) return;

            event.preventDefault();
        }

        scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );
        scope.domElement.addEventListener('mousewheel', onMouseWheel, false);
        scope.domElement.addEventListener("DOMMouseScroll", onMouseWheel, false );
        scope.domElement.addEventListener('mousemove', onMouseMove, false);
        scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
        scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
        scope.domElement.addEventListener("dblclick", onDbClick, false);

        function handleTouchStartRotate(event) {

        }




        function touchStart( event ) {

            if ( scope._enabled === false ) return;

            switch (event.touches.length) {

                case 1:

                    pointerOld.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

                    selectPoint = getIntersectPoint(new THREE.Vector2(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY));

                    scope.pivot.copy(selectPoint);

                    handleTouchStartRotate(event);

                    state = STATE.TOUCH_ROTATE;

                    break;

                case 2:

                    touches[0].set(event.touches[0].pageX, event.touches[0].pageY, 0);

                    touches[1].set(event.touches[1].pageX, event.touches[1].pageY, 0);

                    prevDistance = touches[0].distanceTo(touches[1]);

                    selectPoint = getIntersectPoint(new THREE.Vector2((event.touches[ 0 ].pageX + event.touches[ 1 ].pageX)/2.0, (event.touches[ 0 ].pageY + event.touches[ 1 ].pageY) / 2.0));

                    scope.pivot.copy(selectPoint);

                    state = STATE.TOUCH_DOLLY_PAN;

                    break;

            }

            scope.dispatchEvent(startEvent);

        }

        function touchMove( event ) {

            event.preventDefault();

            event.stopPropagation();

            if ( scope._enabled === false ) return;

            switch (event.touches.length){

                case 1:

                    if ( scope._enableRotate === false ) return;

                    mouse.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);

                    selectPoint = getIntersectPoint(mouse);

                    pointer.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

                    var movementX = pointer.x - pointerOld.x;
                    var movementY = pointer.y - pointerOld.y;

                    handleMouseMoveRotate(new THREE.Vector3( - movementX * 0.01, - movementY * 0.01, 0 ), scope.pivot );

                    pointerOld.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

                    break;

                case 2:

                    touches[0].set(event.touches[0].pageX, event.touches[0].pageY, 0);

                    touches[1].set(event.touches[1].pageX, event.touches[1].pageY, 0);

                    distance = touches[0].distanceTo(touches[1]);

                    var centerPageX = (event.touches[ 0 ].pageX + event.touches[ 1 ].pageX)/2.0;

                    var centerPageY = (event.touches[ 0 ].pageY + event.touches[ 1 ].pageY) / 2.0;

                    var ndcMouse =  {
                        x: ( centerPageX / domElement.clientWidth ) * 2 - 1,
                        y: - ( centerPageY / domElement.clientHeight ) * 2 + 1
                    };

                    mouse.set(centerPageX, centerPageY);

                    selectPoint = getIntersectPoint(mouse);

                    if(scope._enablePan){
                        handleMouseMovePan(event, ndcMouse);

                    }

                    if(scope._enableZoom){
                        scope.wheelDelta = - Math.sign((prevDistance - distance)) / 2;
                    }

                    prevDistance = distance;
                    break;
            }
        }

        function onTouchEnd(){

            if ( scope._enabled === false ) return;

            state = STATE.NONE;

            scope.dispatchEvent(endEvent);
        }

        scope.domElement.addEventListener( 'touchstart', touchStart, false );
        scope.domElement.addEventListener( 'touchmove', touchMove, false );
        scope.domElement.addEventListener( 'touchend', onTouchEnd, false );

        //NDC坐标转世界坐标
        function getIntersectPoint( mouse ) {

            var ndc = getNDCPos(mouse);

            raycaster.setFromCamera( ndc, camera );

            var result = raycaster.intersectObjects( scope.intersectObjects, true );

            for (var i = 0; i < result.length; ++i) {

                var object = result[ i ].object;

                if ( object.visible ) {

                    /*var parent = scope.soonSpace.editor.getParentByProperty(object, 'visible', false, true);
                    if (parent == null) {
                        return result[ i ].point;
                    }*/

                    return result[ i ].point;

                }
            }

        }

        //获取鼠标的标准设备坐标
        function getNDCPos(mouse) {

            var result = new THREE.Vector2();

            result.x = (mouse.x / domElement.offsetWidth ) * 2 - 1;

            result.y = -(mouse.y / domElement.offsetHeight ) * 2 + 1;

            return result;
        }

    }

    /**
     * 加入响应鼠标事件的对象或者模型
     * @memberOf EarthControls.prototype
     * @param object {Object} 响应鼠标事件的对象或者模型
     * @return {Boolean} 返回true则为加入成功
     */
    addIntersectObject(object) {

        var index = this.intersectObjects.indexOf(object);

        if(index === -1){

            this.intersectObjects.push(object);

            return true;
        } else {
            console.error("该对象已经存在，无法重复添加")
        }
    }

    /**
     * 移除响应鼠标事件的对象或者模型
     * @memberOf EarthControls.prototype
     * @param object {Object} 响应鼠标事件的对象或者模型
     * @return {Boolean} 返回true则为移除成功
     */
    removeIntersectObject(object) {

        var index = this.intersectObjects.indexOf(object);

        if ( index !== - 1 ) {
            this.intersectObjects.splice(index, 1);
            return true;
        }
    }

}

//EarthControls.prototype = Object.create( THREE.EventDispatcher.prototype );

Object.assign(EarthControls.prototype, THREE.EventDispatcher.prototype)


/*defineProperties(EarthControls.prototype, {

    /!**
     * 相机Y轴旋转速度
     * @memberOf EarthControls.prototype
     * @default 0
     * @type {Number}
     *!/
    rotateYSpeed: {
        get: function () {
            return this._rotateAxes.x;
        },
        set: function (value) {
            this._rotateAxes.x = value;
        }
    },

    /!**
     * 是否自动旋转
     * @memberOf EarthControls.prototype
     * @default false
     * @type {boolean}
     *!/
    autoRotate: {
        get: function () {
            return this._autoRotate;
        },
        set: function (value) {
            this._autoRotate = value;
        }
    },

    /!**
     * 自动旋转的中心点
     * @memberOf EarthControls.prototype
     * @default new THREE.Vector3(0, 0, 0)
     *!/
    rotateCenter: {
        get: function () {
            return this._rotateCenter;
        },
        set: function (value) {
            this._rotateCenter.copy(value)
        }
    },

    /!**
     * 是否允许缩放
     * @memberOf EarthControls.prototype
     * @type {boolean}
     * @default true
     *!/
    enableZoom: {
        get: function () {
            return this._enableZoom
        },
        set: function (value) {
            this._enableZoom = value;
        }
    },

    /!**
     * 是否允许平移
     * @memberOf EarthControls.prototype
     * @type {boolean}
     * @default true
     *!/
    enablePan: {
        get: function () {
            return this._enablePan;
        },
        set: function (value) {
            this._enablePan = value
        }
    },

    /!**
     * 是否允许旋转
     * @memberOf EarthControls.prototype
     * @type {boolean}
     * @type true
     *!/
    enableRotate: {
        get: function () {
            return this._enableRotate
        },
        set: function (value) {
            this._enableRotate = value;
        }
    },

    /!**
     * 启用该鼠标控制器
     * @memberOf EarthControls.prototype
     * @type {boolean}
     * @default true
     *!/
    enabled: {
        get: function () {
            return this._enabled
        },
        set: function (value) {
            this._enabled = value;
        }
    },

    /!**
     * 滚轮缩放缓动动画衰减因子，越大衰减得越快
     * @memberOf EarthControls.prototype
     * @type {number}
     * @default 15
     *!/
    fadeFactor: {
        get: function () {
            return this._fadeFactor
        },
        set: function (value) {
            this._fadeFactor = value;
        }
    },

    /!**
     * 最大旋转角度
     * @memberOf EarthControls.prototype
     * @type {number}
     * @default Math.PI
     *!/
    maxRotateRange: {
        get: function () {
            return this._maxRotateRange
        },
        set: function (value) {
            this._maxRotateRange = value
        }
    },

    /!**
     * 最小旋转角度
     * @memberOf EarthControls.prototype
     * @type {number}
     * @default Math.PI/2
     *!/
    minRotateRange: {
        get: function () {
            return this._minRotateRange
        },
        set: function (value) {
            this._minRotateRange = value
        }
    },

    /!**
     * 双击放大倍数，0则不放大
     * @memberOf EarthControls.prototype
     * @type {number}
     * @default 2
     *!/
    dbClickZoomScalar: {
        get: function () {
            return this._dbClickZoomScalar
        },
        set: function (value) {
            this._dbClickZoomScalar = value
        }
    },

    /!**
     * 最小缩放距离
     * @memberOf EarthControls.prototype
     * @type {number}
     * @default 20
     *!/
    minZoomDistance: {
        get: function () {
            return this._minZoomDistance;
        },
        set: function (value) {
            return this._minZoomDistance = value;
        }
    },

    /!**
     * 最大缩放距离
     * @memberOf EarthControls.prototype
     * @type {number}
     * @default Infinity
     *!/
    maxZoomDistance: {
        get: function () {
            return this._maxZoomDistance;
        },
        set: function (value) {
            return this._maxZoomDistance = value;
        }
    }


});*/



export {EarthControls}

