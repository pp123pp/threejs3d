import {defined} from "./defined";
import DeveloperError from "./DeveloperError";

export function objectToQuery(obj) {

    if(!defined(obj)){
        throw new DeveloperError(' obj不能为空');
    }

    var result = '';
    for ( var propName in obj) {
        if (obj.hasOwnProperty(propName)) {
            let value = obj[propName];

            var part = encodeURIComponent(propName) + '=';
            if (Array.isArray(value)) {
                for (let i = 0, len = value.length; i < len; ++i) {
                    result += part + encodeURIComponent(value[i]) + '&';
                }
            } else {
                result += part + encodeURIComponent(value) + '&';
            }
        }
    }

    result = result.slice(0, -1);

    // This function used to replace %20 with + which is more compact and readable.
    // However, some servers didn't properly handle + as a space.
    // https://github.com/AnalyticalGraphicsInc/cesium/issues/2192

    return result;

}
