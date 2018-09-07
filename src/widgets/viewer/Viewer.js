import Widgets from "../Widgets";

export default class Viewer {
    constructor(container, options){

        this._widgets = new Widgets(container, options)



    }

    get scene(){
        return this._widgets._scene
    }

    get camera(){
        return this._widgets._camera
    }

    get renderer(){
        return this._widgets._renderer
    }
}
