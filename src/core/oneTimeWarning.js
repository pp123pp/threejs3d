import {defined} from "./defined";
import {defaultValue} from "./defaultValue";
import DeveloperError from "./DeveloperError";

let warnings = {};

function oneTimeWarning(identifier, message) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(identifier)) {
        throw new DeveloperError('identifier is required.');
    }
    //>>includeEnd('debug');

    if (!defined(warnings[identifier])) {
        warnings[identifier] = true;
        console.warn(defaultValue(message, identifier));
    }
}

oneTimeWarning.geometryOutlines = 'Entity geometry outlines are unsupported on terrain. Outlines will be disabled. To enable outlines, disable geometry terrain clamping by explicitly setting height to 0.';

oneTimeWarning.geometryZIndex = 'Entity geometry with zIndex are unsupported when height or extrudedHeight are defined.  zIndex will be ignored';

export {oneTimeWarning}
