import {Check} from "./Check";

export default function binarySearch(array, itemToFind, comparator) {
//>>includeStart('debug', pragmas.debug);
    Check.defined('array', array);
    Check.defined('itemToFind', itemToFind);
    Check.defined('comparator', comparator);
    //>>includeEnd('debug');
    
    let low = 0;
    let high = array.length - 1;
    let i;
    let comparison;
    
    while (low <= high) {
        i = ~~((low + high) / 2);
        comparison = comparator(array[i], itemToFind);
        if (comparison < 0) {
            low = i + 1;
            continue;
        }
        if (comparison > 0) {
            high = i - 1;
            continue;
        }
        return i;
    }
    return ~(high + 1);
}
