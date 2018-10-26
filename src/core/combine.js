import {defaultValue} from "./defaultValue";
import {defined} from "./defined";


export function combine(object1, object2, deep) {
    deep = defaultValue(deep, false);

    let result = {};

    let object1Defined = defined(object1);
    let object2Defined = defined(object2);
    let property;
    let object1Value;
    let object2Value;
    if (object1Defined) {
        for (property in object1) {
            if (object1.hasOwnProperty(property)) {
                object1Value = object1[property];
                if (object2Defined && deep && typeof object1Value === 'object' && object2.hasOwnProperty(property)) {
                    object2Value = object2[property];
                    if (typeof object2Value === 'object') {
                        result[property] = combine(object1Value, object2Value, deep);
                    } else {
                        result[property] = object1Value;
                    }
                } else {
                    result[property] = object1Value;
                }
            }
        }
    }
    if (object2Defined) {
        for (property in object2) {
            if (object2.hasOwnProperty(property) && !result.hasOwnProperty(property)) {
                object2Value = object2[property];
                result[property] = object2Value;
            }
        }
    }
    return result;
}
