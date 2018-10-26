import {Check} from "./Check";

let blobUriRegex = /^blob:/i;

function isBlobUri(uri) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.string('uri', uri);
    //>>includeEnd('debug');
    
    return blobUriRegex.test(uri);
}

export default isBlobUri
