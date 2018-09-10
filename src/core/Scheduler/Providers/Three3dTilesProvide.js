import * as THREE from 'three';
import {defaultValue} from "../../defaultValue";
import Fetcher from "./Fetcher";

export default class Three3dTilesProvide {
    constructor(){
    
    }
    
    preProcessDataLayer( layer, view){
        
        layer.sseThreshold = defaultValue(layer.sseThreshold, 16);
        
        return Fetcher.json(layer.url, layer.networkOptions).then((tileset)=>{
        
        });
        
    }
}