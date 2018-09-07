import {freezeObject} from "./freezeObject";

function defaultValue(a, b) {
    if (a !== undefined && a !== null) {
        return a;
    }
    return b;
}

defaultValue.EMPTY_OBJECT = freezeObject({});

export {defaultValue}
