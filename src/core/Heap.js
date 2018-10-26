/**
 * Array implementation of a heap.
 *
 * @alias Heap
 * @constructor
 * @private
 *
 * @param {Object} options Object with the following properties:
 * @param {Heap~ComparatorCallback} options.comparator The comparator to use for the heap. If comparator(a, b) is less than 0, sort a to a lower index than b, otherwise sort to a higher index.
 */
import {defaultValue} from "./defaultValue";
import {Check} from "./Check";
import {defined} from "./defined";


function swap(array, a, b) {
    var temp = array[a];
    array[a] = array[b];
    array[b] = temp;
}

export default class Heap {
    constructor(options){
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('options', options);
        Check.defined('options.comparator', options.comparator);
        //>>includeEnd('debug');
    
        this._comparator = options.comparator;
        this._array = [];
        this._length = 0;
        this._maximumLength = undefined;
    }
    
    reserve(length){
        length = defaultValue(length, this._length);
        this._array.length = length;
    
    }
    
    heapify(index){
        index = defaultValue(index, 0);
        var length = this._length;
        var comparator = this._comparator;
        var array = this._array;
        var candidate = -1;
        var inserting = true;
    
        while (inserting) {
            var right = 2 * (index + 1);
            var left = right - 1;
        
            if (left < length && comparator(array[left], array[index]) < 0) {
                candidate = left;
            } else {
                candidate = index;
            }
        
            if (right < length && comparator(array[right], array[candidate]) < 0) {
                candidate = right;
            }
            if (candidate !== index) {
                swap(array, candidate, index);
                index = candidate;
            } else {
                inserting = false;
            }
        }
    }
    
    resort(){
        var length = this._length;
        for (var i = Math.ceil(length / 2); i >= 0; --i) {
            this.heapify(i);
        }
    }
    
    insert(element){
        //>>includeStart('debug', pragmas.debug);
        Check.defined('element', element);
        //>>includeEnd('debug');
    
        var array = this._array;
        var comparator = this._comparator;
        var maximumLength = this._maximumLength;
    
        var index = this._length++;
        if (index < array.length) {
            array[index] = element;
        } else {
            array.push(element);
        }
    
        while (index !== 0) {
            var parent = Math.floor((index - 1) / 2);
            if (comparator(array[index], array[parent]) < 0) {
                swap(array, index, parent);
                index = parent;
            } else {
                break;
            }
        }
    
        var removedElement;
    
        if (defined(maximumLength) && (this._length > maximumLength)) {
            removedElement = array[maximumLength];
            this._length = maximumLength;
        }
    
        return removedElement;
    
    }
    
    pop(index){
        index = defaultValue(index, 0);
        if (this._length === 0) {
            return undefined;
        }
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number.lessThan('index', index, this._length);
        //>>includeEnd('debug');
    
        var array = this._array;
        var root = array[index];
        swap(array, index, --this._length);
        this.heapify(index);
        return root;
    }
    
    get length(){
        return this._length;
    }
    
    get internalArray(){
        return this._array
    }
    
    get maximumLength(){
        return this._maximumLength;
    }
    
    set maximumLength(value){
        this._maximumLength = value;
        if (this._length > value && value > 0) {
            this._length = value;
            this._array.length = value;
        }
    }
    
    get comparator(){
        return this._comparator;
    }
}

