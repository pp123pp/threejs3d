import DeveloperError from "./DeveloperError";
import {defined} from "./defined";

export function queryToObject(queryString) {
    if (!defined(queryString)) {
        throw new DeveloperError('queryString is required.');
    }

    let result = {};
    if (queryString === '') {
        return result;
    }
    let parts = queryString.replace(/\+/g, '%20').split(/[&;]/);
    for (let i = 0, len = parts.length; i < len; ++i) {
        let subparts = parts[i].split('=');

        let name = decodeURIComponent(subparts[0]);
        let value = subparts[1];
        if (defined(value)) {
            value = decodeURIComponent(value);
        } else {
            value = '';
        }

        let resultValue = result[name];
        if (typeof resultValue === 'string') {
            // expand the single value to an array
            result[name] = [resultValue, value];
        } else if (Array.isArray(resultValue)) {
            resultValue.push(value);
        } else {
            result[name] = value;
        }
    }
    return result;
}
