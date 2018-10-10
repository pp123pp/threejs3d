import {defaultValue} from "./defaultValue";
import {RequestType} from "./RequestType";
import {RequestState} from "./RequestState";
import {defined} from "./defined";


export default class Request {
    /**
     * 保存请求信息，不需要直接实例化
     * @param options
     */
    constructor(options){

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        let throttleByServer = defaultValue(options.throttleByServer, false);

        let throttle = throttleByServer || defaultValue(options.throttle, false);

        /**
         * 请求的url地址
         */
        this.url = options.url;

        /**
         * 发出实际请求数据的函数
         */
        this.requestFunction = options.requestFunction;

        /**
         * 取消请求时调用的函数
         */
        this.cancelFunction = options.cancelFunction;

        /**
         *  更新请求优先级的函数，每帧会被调用一次
         */
        this.priorityFunction = options.priorityFunction;

        /**
         * 请求的初始优先级，值越低优先级越高，对于基于世界所要渲染的物体，这个值通常是该物体与相机的距离，
         * 没有优先级函数的请求，默认值为0，如果定义了priorityFunction，则每帧都会调用该函数来更新这个值
         */
        this.priority = defaultValue(options.priority, 0.0);

        /**
         * 是否限制该请求的优先级，默认为false，
         * 如果为false，则会立即发送该请求，否则会根据优先级限制请求
         */
        this.throttle = throttle;

        /**
         * 是否通过服务器请求限制，http1为6-8个，http2无上限
         */
        this.throttleByServer = throttleByServer;

        /**
         * 请求数据类型
         */
        this.type = defaultValue(options.type, RequestType.OTHER);

        /**
         * 用来标记当前请求的服务器的key
         * @type {undefined}
         */
        this.serverKey = undefined;

        /**
         * 当前请求的状态
         * @type {number}
         */
        this.state = RequestState.UNISSUED;

        this.deferred = undefined;

        /**
         * 该请求是否被显式的取消
         * @type {boolean}
         */
        this.cancelled = false;

    }

    cancel(){
        this.cancelled = true
    }

    /**
     * 复制该请求实例
     * @param result
     */
    clone(result){
        if(!defined(result)){
            return new Request(this)
        }

        result.url = this.url;
        result.requestFunction = this.requestFunction;
        result.cancelFunction = this.cancelFunction;
        result.priorityFunction = this.priorityFunction;
        result.priority = this.priority;
        result.throttle = this.throttle;
        result.throttleByServer = this.throttleByServer;
        result.type = this.type;
        result.serverKey = this.serverKey;

        //这里使用默认值，因为该请求还未发送
        result.state = this.RequestState.UNISSUED;
        result.deferred = undefined;
        result.cancelled = false;

        return result;
    }
}
