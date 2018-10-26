import * as THREE from 'three'
import {defined} from "../../core/defined";
import DeveloperError from "../../core/DeveloperError";
import {defaultValue} from "../../core/defaultValue";

export const MathExtension = {
    
    EPSILON7: 0.0000001,
    
    EPSILON15: 0.000000000000001,
    
    fog: function(distanceToCamera, density) {
        let scalar = distanceToCamera * density;
        return 1.0 - Math.exp(-(scalar * scalar));
    },
    
    equalsEpsilon: function (left, right, relativeEpsilon, absoluteEpsilon) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(left)) {
            throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required.');
        }
        if (!defined(relativeEpsilon)) {
            throw new DeveloperError('relativeEpsilon is required.');
        }
        //>>includeEnd('debug');
        absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
        var absDiff = Math.abs(left - right);
        return absDiff <= absoluteEpsilon || absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right));
    }
    
};

Object.assign(THREE.Math, MathExtension);
