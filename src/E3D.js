import * as THREE from 'three'
import Tileset from "./renderer/3dtiles/Tileset";
import Viewer from "./widgets/viewer/Viewer";
import Widgets from "./widgets/Widgets";
import {EarthControls} from "./scene/EarthControls";
import GlobeScene from "./scene/GlobeScene";
import B3DMLoader from "./renderer/loaders/B3DMLoader";


let E3D = {};

Object.assign(E3D, {
    THREE: THREE,
    Tileset: Tileset,
    Viewer: Viewer,
    Widgets: Widgets,
    EarthControls: EarthControls,
    GlobeScene: GlobeScene,
    B3DMLoader: B3DMLoader
});

export {E3D}
