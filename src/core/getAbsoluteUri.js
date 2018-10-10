import {defined} from "./defined";
import {Uri} from "../ThirdParty/Uri";
import {defaultValue} from "./defaultValue";
import DeveloperError from "./DeveloperError";


export function getAbsoluteUri(relative, base) {
    var documentObject;
    if (typeof document !== 'undefined') {
        documentObject = document;
    }

    return getAbsoluteUri._implementation(relative, base, documentObject);
}

getAbsoluteUri._implementation = function(relative, base, documentObject) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(relative)) {
        throw new DeveloperError('relative uri is required.');
    }
    //>>includeEnd('debug');

    if (!defined(base)) {
        if (typeof documentObject === 'undefined') {
            return relative;
        }
        base = defaultValue(documentObject.baseURI, documentObject.location.href);
    }

    var baseUri = new Uri(base);
    var relativeUri = new Uri(relative);
    return relativeUri.resolve(baseUri).toString();
};
