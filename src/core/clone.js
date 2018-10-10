import {defaultValue} from "./defaultValue";

/**
 * 克隆一个具有相同属性的对象，并返回该对象
 */
export function clone(object, deep) {
    if(object === null || typeof object !== 'object'){
        return object;
    }

    deep = defaultValue(deep, false);

    let result = new object.constructor();

    //遍历该对象的所有属性
    for (let propertyName in object){
        //如果当前对象有该属性
        if(object.hasOwnProperty(propertyName)){
            let value = object[propertyName];
            if(deep){
                value = clone(value, deep)
            }
            result[propertyName] = value;
        }
    }

    return result;
}
