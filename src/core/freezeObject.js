import {defined} from "./defined";

var freezeObject = Object.freeze;
if (!defined(freezeObject)) {
    freezeObject = function(o) {
        return o;
    };
}

export {freezeObject};
