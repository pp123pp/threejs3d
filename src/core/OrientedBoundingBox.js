import * as THREE from 'three'
import {defaultValue} from "./defaultValue";
import {Extension} from "../renderer/ThreeExtended/Extension";
import {defined} from "./defined";
import DeveloperError from "./DeveloperError";
import {Intersect} from "./Intersect";


let scratchOffset = new THREE.Vector3();
let scratchScale = new THREE.Vector3();

let scratchCartesianU = new THREE.Vector3();
let scratchCartesianV = new THREE.Vector3();
let scratchCartesianW = new THREE.Vector3();
let scratchPPrime = new THREE.Vector3();
/**
 * Creates an instance of an OrientedBoundingBox.
 * An OrientedBoundingBox of some object is a closed and convex cuboid. It can provide a tighter bounding volume than {@link BoundingSphere} or {@link AxisAlignedBoundingBox} in many cases.
 * @alias OrientedBoundingBox
 * @constructor
 *
 * @param {Vector3} [center=Vector3.ZERO] The center of the box.
 * @param {Matrix3} [halfAxes=Matrix3.ZERO] The three orthogonal half-axes of the bounding box.
 *                                          Equivalently, the transformation matrix, to rotate and scale a 0x0x0
 *                                          cube centered at the origin.
 *
 *
 * @example
 * // Create an OrientedBoundingBox using a transformation matrix, a position where the box will be translated, and a scale.
 * let center = new Cesium.Vector3(1.0, 0.0, 0.0);
 * let halfAxes = Cesium.Matrix3.fromScale(new Cesium.Vector3(1.0, 3.0, 2.0), new Cesium.Matrix3());
 *
 * let obb = new Cesium.OrientedBoundingBox(center, halfAxes);
 *
 * @see BoundingSphere
 * @see BoundingRectangle
 */
function OrientedBoundingBox(center, halfAxes) {
    /**
     * The center of the box.
     * @type {Vector3}
     * @default {@link Vector3.ZERO}
     */
    this.center = new THREE.Vector3().copy(defaultValue(center, THREE.Vector3.ZERO));
    /**
     * The transformation matrix, to rotate the box to the right position.
     * @type {Matrix3}
     * @default {@link Matrix3.ZERO}
     */
    this.halfAxes = new THREE.Matrix3().copy(defaultValue(halfAxes, THREE.Vector3.ZERO));
}




/**
 * Determines which side of a plane the oriented bounding box is located.
 *
 * @param {Plane} plane The plane to test against.
 * @returns {Intersect} {@link Intersect.INSIDE} if the entire box is on the side of the plane
 *                      the normal is pointing, {@link Intersect.OUTSIDE} if the entire box is
 *                      on the opposite side, and {@link Intersect.INTERSECTING} if the box
 *                      intersects the plane.
 */
OrientedBoundingBox.prototype.intersectPlane = function(plane) {
    return OrientedBoundingBox.intersectPlane(this, plane);
};

OrientedBoundingBox.prototype.distanceSquaredTo = function(cartesian) {
    return OrientedBoundingBox.distanceSquaredTo(this, cartesian);
};


/**
 * Determines which side of a plane the oriented bounding box is located.
 *
 * @param {OrientedBoundingBox} box The oriented bounding box to test.
 * @param {Plane} plane The plane to test against.
 * @returns {Intersect} {@link Intersect.INSIDE} if the entire box is on the side of the plane
 *                      the normal is pointing, {@link Intersect.OUTSIDE} if the entire box is
 *                      on the opposite side, and {@link Intersect.INTERSECTING} if the box
 *                      intersects the plane.
 */
OrientedBoundingBox.intersectPlane = function(box, plane) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(box)) {
        throw new DeveloperError('box is required.');
    }
    
    if (!defined(plane)) {
        throw new DeveloperError('plane is required.');
    }
    //>>includeEnd('debug');
    
    var center = box.center;
    var normal = plane.normal;
    var halfAxes = box.halfAxes;
    var normalX = normal.x, normalY = normal.y, normalZ = normal.z;
    // plane is used as if it is its normal; the first three components are assumed to be normalized
    var radEffective = Math.abs(normalX * halfAxes[THREE.Matrix3.COLUMN0ROW0] + normalY * halfAxes[THREE.Matrix3.COLUMN0ROW1] + normalZ * halfAxes[THREE.Matrix3.COLUMN0ROW2]) +
        Math.abs(normalX * halfAxes[THREE.Matrix3.COLUMN1ROW0] + normalY * halfAxes[THREE.Matrix3.COLUMN1ROW1] + normalZ * halfAxes[THREE.Matrix3.COLUMN1ROW2]) +
        Math.abs(normalX * halfAxes[THREE.Matrix3.COLUMN2ROW0] + normalY * halfAxes[THREE.Matrix3.COLUMN2ROW1] + normalZ * halfAxes[THREE.Matrix3.COLUMN2ROW2]);
    var distanceToPlane = normal.dot(center) + plane.constant;
    
    if (distanceToPlane <= -radEffective) {
        // The entire box is on the negative side of the plane normal
        return Intersect.OUTSIDE;
    } else if (distanceToPlane >= radEffective) {
        // The entire box is on the positive side of the plane normal
        return Intersect.INSIDE;
    }
    return Intersect.INTERSECTING;
};


OrientedBoundingBox.distanceSquaredTo = function(box, cartesian) {
    // See Geometric Tools for Computer Graphics 10.4.2
    
    //>>includeStart('debug', pragmas.debug);
    if (!defined(box)) {
        throw new DeveloperError('box is required.');
    }
    if (!defined(cartesian)) {
        throw new DeveloperError('cartesian is required.');
    }
    //>>includeEnd('debug');
    
    let offset = scratchOffset.subVectors(cartesian, box.center);
    
    let halfAxes = box.halfAxes;
    let u = THREE.Matrix3.getColumn(halfAxes, 0, scratchCartesianU);
    let v = THREE.Matrix3.getColumn(halfAxes, 1, scratchCartesianV);
    let w = THREE.Matrix3.getColumn(halfAxes, 2, scratchCartesianW);
    
    let uHalf = u.length();
    let vHalf = v.length();
    let wHalf = w.length();
    
    u.normalize();
    v.normalize();
    w.normalize();
    
    let pPrime = scratchPPrime;
    pPrime.x = offset.dot(u);
    pPrime.y = offset.dot(v);
    pPrime.z = offset.dot(w);
    
    let distanceSquared = 0.0;
    let d;
    
    if (pPrime.x < -uHalf) {
        d = pPrime.x + uHalf;
        distanceSquared += d * d;
    } else if (pPrime.x > uHalf) {
        d = pPrime.x - uHalf;
        distanceSquared += d * d;
    }
    
    if (pPrime.y < -vHalf) {
        d = pPrime.y + vHalf;
        distanceSquared += d * d;
    } else if (pPrime.y > vHalf) {
        d = pPrime.y - vHalf;
        distanceSquared += d * d;
    }
    
    if (pPrime.z < -wHalf) {
        d = pPrime.z + wHalf;
        distanceSquared += d * d;
    } else if (pPrime.z > wHalf) {
        d = pPrime.z - wHalf;
        distanceSquared += d * d;
    }
    
    return distanceSquared;
};




export {OrientedBoundingBox}
