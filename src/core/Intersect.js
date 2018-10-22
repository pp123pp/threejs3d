export const Intersect = {
    /**
     * Represents that an object is not contained within the frustum.
     *
     * @type {Number}
     * @constant
     */
    OUTSIDE : -1,
    
    /**
     * Represents that an object intersects one of the frustum's planes.
     *
     * @type {Number}
     * @constant
     */
    INTERSECTING : 0,
    
    /**
     * Represents that an object is fully within the frustum.
     *
     * @type {Number}
     * @constant
     */
    INSIDE : 1
};
