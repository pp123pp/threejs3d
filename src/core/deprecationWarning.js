import {oneTimeWarning} from "./oneTimeWarning";
import {defined} from "./defined";
import DeveloperError from "./DeveloperError";

function deprecationWarning(identifier, message) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(identifier) || !defined(message)) {
        throw new DeveloperError('identifier and message are required.');
    }
    //>>includeEnd('debug');

    oneTimeWarning(identifier, message);
}

export {deprecationWarning}
