import {Check} from "./Check";
import {Uri} from "../ThirdParty/Uri";
import {defined} from "./defined";

let numberOfActiveRequestsByServer = {};

let pageUri = typeof document !== 'undefined' ? new Uri(document.location.href) : new Uri();

export default class RequestScheduler {

    static getServerKey(url){
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.string('url', url);
        //>>includeEnd('debug');

        let uri = new Uri(url).resolve(pageUri);
        uri.normalize();
        let serverKey = uri.authority;
        if (!/:/.test(serverKey)) {
            // If the authority does not contain a port number, add port 443 for https or port 80 for http
            serverKey = serverKey + ':' + (uri.scheme === 'https' ? '443' : '80');
        }

        let length = numberOfActiveRequestsByServer[serverKey];
        if (!defined(length)) {
            numberOfActiveRequestsByServer[serverKey] = 0;
        }

        return serverKey;
    }
}
