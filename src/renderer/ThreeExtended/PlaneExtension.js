import * as THREE from 'three'
import {Check} from "../../core/Check";
import {defined} from "../../core/defined";

export const PlaneExtension = {
    fromCartesian4: function (coefficients, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('coefficients', coefficients);
        //>>includeEnd('debug');
    
        let normal = new THREE.Vector3().copy(coefficients);
        let distance = coefficients.w;
    
        //>>includeStart('debug', pragmas.debug);
/*        if (!CesiumMath.equalsEpsilon(Cartesian3.magnitude(normal), 1.0, CesiumMath.EPSILON6)) {
            throw new DeveloperError('normal must be normalized.');
        }*/
        //>>includeEnd('debug');
    
        if (!defined(result)) {
            return new THREE.Plane(normal, distance);
        }
        result.normal.copy(normal, result.normal);
        result.constant = distance;
        return result;
    }
};

Object.assign(THREE.Plane, PlaneExtension);
