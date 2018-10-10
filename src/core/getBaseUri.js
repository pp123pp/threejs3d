
import {defined} from "./defined";
import DeveloperError from "./DeveloperError";
import {Uri} from "../ThirdParty/Uri";

/**
 * 返回url的基础路径
 * @param uri
 * @param includeQuery
 */
export function getBaseUri(uri, includeQuery) {
    if(!defined(uri)){
        throw new DeveloperError('uri不能为空');
    }

    var basePath = '';
    let i = uri.lastIndexOf('/');
    if (i !== -1) {
        basePath = uri.substring(0, i + 1);
    }

    if (!includeQuery) {
        return basePath;
    }

    uri = new Uri(uri);
    if (defined(uri.query)) {
        basePath += '?' + uri.query;
    }
    if (defined(uri.fragment)){
        basePath += '#' + uri.fragment;
    }

    return basePath;

}
