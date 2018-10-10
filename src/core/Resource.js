import * as THREE from 'three'
import {defaultValue} from "./defaultValue";
import {Check} from "./Check";
import {clone} from "./clone"
import Request from "./Request";
import {Uri} from "../ThirdParty/Uri";
import {objectToQuery} from "./objectToQuery";
import {defined} from "./defined";
import {queryToObject} from "./queryToObject";
import {getBaseUri} from "./getBaseUri";
import {isDataUri} from "./isDataUri";
import Fetcher from "./Scheduler/Providers/Fetcher";
import {getAbsoluteUri} from "./getAbsoluteUri";

let xhrBlobSupported = (function() {
    try {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', '#', true);
        xhr.responseType = 'blob';
        return xhr.responseType === 'blob';
    } catch (e) {
        return false;
    }
})();

/**
 * Parses a query string and returns the object equivalent.
 *
 * @param {Uri} uri The Uri with a query object.
 * @param {Resource} resource The Resource that will be assigned queryParameters.
 * @param {Boolean} merge If true, we'll merge with the resource's existing queryParameters. Otherwise they will be replaced.
 * @param {Boolean} preserveQueryParameters If true duplicate parameters will be concatenated into an array. If false, keys in uri will take precedence.
 *
 * @private
 */
function parseQuery(uri, resource, merge, preserveQueryParameters) {
    let queryString = uri.query;
    if (!defined(queryString) || (queryString.length === 0)) {
        return {};
    }

    let query;
    // Special case we run into where the querystring is just a string, not key/value pairs
    if (queryString.indexOf('=') === -1) {
        let result = {};
        result[queryString] = undefined;
        query = result;
    } else {
        query = queryToObject(queryString);
    }

    if (merge) {
        resource._queryParameters = combineQueryParameters(query, resource._queryParameters, preserveQueryParameters);
    } else {
        resource._queryParameters = query;
    }
    uri.query = undefined;
}

/**
 * Converts a query object into a string.
 *
 * @param {Uri} uri The Uri object that will have the query object set.
 * @param {Resource} resource The resource that has queryParameters
 *
 * @private
 */
function stringifyQuery(uri, resource) {
    let queryObject = resource._queryParameters;

    let keys = Object.keys(queryObject);

    // We have 1 key with an undefined value, so this is just a string, not key/value pairs
    if (keys.length === 1 && !defined(queryObject[keys[0]])) {
        uri.query = keys[0];
    } else {
        uri.query = objectToQuery(queryObject);
    }
}

/**
 * Clones a value if it is defined, otherwise returns the default value
 *
 * @param {*} [val] The value to clone.
 * @param {*} [defaultVal] The default value.
 *
 * @returns {*} A clone of val or the defaultVal.
 *
 * @private
 */
function defaultClone(val, defaultVal) {
    if (!defined(val)) {
        return defaultVal;
    }

    return defined(val.clone) ? val.clone() : clone(val);
}

/**
 * Checks to make sure the Resource isn't already being requested.
 *
 * @param {Request} request The request to check.
 *
 * @private
 */
function checkAndResetRequest(request) {
    if (request.state === RequestState.ISSUED || request.state === RequestState.ACTIVE) {
        throw new RuntimeError('The Resource is already being fetched.');
    }

    request.state = RequestState.UNISSUED;
    request.deferred = undefined;
}

function combineQueryParameters(q1, q2, preserveQueryParameters) {
    if (!preserveQueryParameters) {
        return combine(q1, q2);
    }

    let result = clone(q1, true);
    for (let param in q2) {
        if (q2.hasOwnProperty(param)) {
            let value = result[param];
            let q2Value = q2[param];
            if (defined(value)) {
                if (!Array.isArray(value)) {
                    value = result[param] = [value];
                }

                result[param] = value.concat(q2Value);
            } else {
                result[param] = Array.isArray(q2Value) ? q2Value.slice() : q2Value;
            }
        }
    }

    return result;
}

/**
 * 资源加载类，并提供重试请求的功能
 */
export default class Resource {
    constructor(options){

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        if(typeof options === "string"){
            options = {
                url: options
            }
        }

        Check.typeOf.string('options.url', options.url);
        this._templateValues = defaultClone(options.templateValues, {});
        this._queryParameters = defaultClone(options.queryParameters, {});

        /**
         * 随请求一起发送的http请求头
         */
        this.headers = defaultValue(options.headers, {});

        /**
         * 将使用的Request对象，仅供内部使用
         */
        this.request = defaultValue(options.request, new Request());

        /**
         * 加载资源时所使用的代理
         * @type {*|features.proxy|T|proxy}
         */
        this.proxy = options.proxy;

        /**
         * 请求资源失败时调用的函数，如果返回true，则重试请求
         */
        this.retryCallback = options.retryCallback;

        /**
         * 在放弃之前应该调用retryCallback的次数
         */
        this.retryAttempts = defaultValue(options.retryAttempts, 0);
        this._retryCount = 0;

        let uri = new Uri(options.url);
        parseQuery(uri, this, true, true);

        uri.fragment = undefined;

        this._url = uri.toString();

    }

    clone(result){
        if (!defined(result)) {
            result = new Resource({
                url : this._url
            });
        }

        result._url = this._url;
        result._queryParameters = clone(this._queryParameters);
        result._templateValues = clone(this._templateValues);
        result.headers = clone(this.headers);
        result.proxy = this.proxy;
        result.retryCallback = this.retryCallback;
        result.retryAttempts = this.retryAttempts;
        result._retryCount = 0;
        result.request = this.request.clone();

        return result;
    }

    getDerivedResource(options){
        let resource = this.clone();
        resource._retryCount = 0;

        if(defined(options.url)){
            let uri = new Uri(options.url);

            var preserveQueryParameters = defaultValue(options.preserveQueryParameters, false);
            parseQuery(uri, resource, true, preserveQueryParameters);

            // Remove the fragment as it's not sent with a request
            uri.fragment = undefined;

            resource._url = uri.resolve(new Uri(getAbsoluteUri(this._url))).toString();
        }

        if (defined(options.queryParameters)) {
            resource._queryParameters = combine(options.queryParameters, resource._queryParameters);
        }
        if (defined(options.templateValues)) {
            resource._templateValues = combine(options.templateValues, resource.templateValues);
        }
        if (defined(options.headers)) {
            resource.headers = combine(options.headers, resource.headers);
        }
        if (defined(options.proxy)) {
            resource.proxy = options.proxy;
        }
        if (defined(options.request)) {
            resource.request = options.request;
        }
        if (defined(options.retryCallback)) {
            resource.retryCallback = options.retryCallback;
        }
        if (defined(options.retryAttempts)) {
            resource.retryAttempts = options.retryAttempts;
        }

        return resource;


    }

    static createIfNeeded(resource){
        if (resource instanceof Resource) {
            // Keep existing request object. This function is used internally to duplicate a Resource, so that it can't
            //  be modified outside of a class that holds it (eg. an imagery or terrain provider). Since the Request objects
            //  are managed outside of the providers, by the tile loading code, we want to keep the request property the same so if it is changed
            //  in the underlying tiling code the requests for this resource will use it.
            return  resource.getDerivedResource({
                request: resource.request
            });
        }

        if (typeof resource !== 'string') {
            return resource;
        }

        return new Resource({
            url: resource
        });
    }

    getBaseUri(includeQuery){
        return getBaseUri(this.getUrlComponent(includeQuery), includeQuery);
    }

    fetchJson(){
        return Fetcher.json(this._url)
    }

    setQueryParameters(params, useAsDefault){
        if (useAsDefault) {
            this._queryParameters = combineQueryParameters(this._queryParameters, params, false);
        } else {
            this._queryParameters = combineQueryParameters(params, this._queryParameters, false);
        }
    }

    static get isBlobSupported(){
        return xhrBlobSupported
    }

    get queryParameters(){
        return this._queryParameters;
    }

    get isDataUri(){
        return isDataUri(this._url)
    }
}
