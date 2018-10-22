import * as THREE from 'three'

export const MathExtension = {
    
    EPSILON7: 0.0000001,
    
    fog: function(distanceToCamera, density) {
        let scalar = distanceToCamera * density;
        return 1.0 - Math.exp(-(scalar * scalar));
    }
    
};

Object.assign(THREE.Math, MathExtension);
