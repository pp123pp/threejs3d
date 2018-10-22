import * as THREE from 'three'
import {Intersect} from "../../core/Intersect";
import {defined} from "../../core/defined";
import DeveloperError from "../../core/DeveloperError";
import {PlaneExtension} from "./PlaneExtension";

let scratchPlane = new THREE.Vector3();

export const FrustumExtension = {
    
    /**
     * For plane masks (as used in {@link CullingVolume#computeVisibilityWithPlaneMask}), this special value
     * represents the case where the object bounding volume is entirely outside the culling volume.
     *
     * @type {Number}
     * @private
     */
    MASK_OUTSIDE:  0xffffffff,

    /**
     * For plane masks (as used in {@link CullingVolume.prototype.computeVisibilityWithPlaneMask}), this value
     * represents the case where the object bounding volume is entirely inside the culling volume.
     *
     * @type {Number}
     * @private
     */
    MASK_INSIDE: 0x00000000,
    
    /**
     * For plane masks (as used in {@link CullingVolume.prototype.computeVisibilityWithPlaneMask}), this value
     * represents the case where the object bounding volume (may) intersect all planes of the culling volume.
     *
     * @type {Number}
     * @private
     */
    MASK_INDETERMINATE: 0x7fffffff,
    
};

Object.assign(THREE.Frustum, FrustumExtension);

Object.assign(THREE.Frustum.prototype, {
    computeVisibilityWithPlaneMask: function (boundingVolume, parentPlaneMask) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(boundingVolume)) {
            throw new DeveloperError('boundingVolume is required.');
        }
        if (!defined(parentPlaneMask)) {
            throw new DeveloperError('parentPlaneMask is required.');
        }
        //>>includeEnd('debug');
        
        if (parentPlaneMask === FrustumExtension.MASK_OUTSIDE || parentPlaneMask === FrustumExtension.MASK_INSIDE) {
            // parent is completely outside or completely inside, so this child is as well.
            return parentPlaneMask;
        }
        
        // Start with MASK_INSIDE (all zeros) so that after the loop, the return value can be compared with MASK_INSIDE.
        // (Because if there are fewer than 31 planes, the upper bits wont be changed.)
        var mask = FrustumExtension.MASK_INSIDE;
        
        var planes = this.planes;
        for (var k = 0, len = planes.length; k < len; ++k) {
            // For k greater than 31 (since 31 is the maximum number of INSIDE/INTERSECTING bits we can store), skip the optimization.
            var flag = (k < 31) ? (1 << k) : 0;
            if (k < 31 && (parentPlaneMask & flag) === 0) {
                // boundingVolume is known to be INSIDE this plane.
                continue;
            }
            
            var result = boundingVolume.intersectPlane(planes[k]);
            if (result === Intersect.OUTSIDE) {
                return FrustumExtension.MASK_OUTSIDE;
            } else if (result === Intersect.INTERSECTING) {
                mask |= flag;
            }
        }
        
        return mask;
    }
})
