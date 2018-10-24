import * as THREE from 'three'
import {Check} from "../../core/Check";

export const Matrix3Extension = {
    getColumn: function (matrix, index, result) {
        
        let e = matrix.elements;
        
        let startIndex = index * 3;
        let x = e[startIndex];
        let y = e[startIndex + 1];
        let z = e[startIndex + 2];
    
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    },
    
    magnitudeSquared: function(cartesian){
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');
    
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z;
    },
    
    magnitude: function(cartesian){
        return Math.sqrt(THREE.Vector3.magnitudeSquared(cartesian));
    },
    
    /**
     * The index into Matrix3 for column 0, row 0.
     *
     * @type {Number}
     * @constant
     */
    COLUMN0ROW0: 0,

    /**
     * The index into Matrix3 for column 0, row 1.
     *
     * @type {Number}
     * @constant
     */
    COLUMN0ROW1: 1,
    
    /**
     * The index into Matrix3 for column 0, row 2.
     *
     * @type {Number}
     * @constant
     */
    COLUMN0ROW2: 2,
    
    /**
     * The index into Matrix3 for column 1, row 0.
     *
     * @type {Number}
     * @constant
     */
    COLUMN1ROW0: 3,
    
    /**
     * The index into Matrix3 for column 1, row 1.
     *
     * @type {Number}
     * @constant
     */
    COLUMN1ROW1: 4,
    
    /**
     * The index into Matrix3 for column 1, row 2.
     *
     * @type {Number}
     * @constant
     */
    COLUMN1ROW2: 5,
    
    /**
     * The index into Matrix3 for column 2, row 0.
     *
     * @type {Number}
     * @constant
     */
    COLUMN2ROW0: 6,
    
    /**
     * The index into Matrix3 for column 2, row 1.
     *
     * @type {Number}
     * @constant
     */
    COLUMN2ROW1: 7,
    
    /**
     * The index into Matrix3 for column 2, row 2.
     *
     * @type {Number}
     * @constant
     */
    COLUMN2ROW2: 8,
};

Object.assign(THREE.Matrix3, Matrix3Extension);
