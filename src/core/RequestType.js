/**
 * 数据请求类型
 * @type {{IMAGERY: number, TILES3D: number, OTHER: number}}
 */
const RequestType = {
    
    /**
     * Terrain request.
     *
     * @type Number
     * @constant
     */
    TERRAIN : 0,
    
    /**
     * Imagery request.
     *
     * @type Number
     * @constant
     */
    IMAGERY : 1,
    
    /**
     * 3D Tiles request.
     *
     * @type Number
     * @constant
     */
    TILES3D : 2,
    
    /**
     * Other request.
     *
     * @type Number
     * @constant
     */
    OTHER : 3
};

export {RequestType}
