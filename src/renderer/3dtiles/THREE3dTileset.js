import * as THREE from 'three';
import {defined} from "../../core/defined";
import './../ThreeExtended/Extension'

export default class THREE3dTileset extends THREE.Object3D{
    constructor(options = {}){
        
        super();
        
        let url = options.url;
        
        if(!defined(url)) {throw "options.url不能为空"}
        
    }
    
    pre3dTilesUpdate(context){
        const hypotenuse = Math.sqrt(context.camera.containerWidth * context.camera.containerWidth + context.camera.containerHeight * context.camera.containerHeight);
        //相机的观察角度
        const radAngle = context.camera.fov * Math.PI / 180;
    
        //SSE用来判定HLOD细化，即，一个瓦片在当前视图是否足够精细，它的子瓦片是否需要考虑。
        //SSE：屏幕空间误差，计算公式：http://www.cjig.cn/html/jig/2018/7/20180714.htm
        // TODO: not correct -> see new preSSE
        // const HFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) / context.camera.ratio);
        const HYFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) * hypotenuse / context.camera.containerWidth);
        context.camera.preSSE = hypotenuse * (2.0 * Math.tan(HYFOV * 0.5));
    }
    
    mainLoopUpdate(context){
        this.pre3dTilesUpdate(context);
        
        //console.log(context.camera.preSSE)
    }
}