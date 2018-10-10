import {defaultValue} from "./defaultValue";
import {Check} from "./Check";

export default class ManagedArray {
    constructor(length){
        length = defaultValue(length, 0);
        this._array = new Array(length);
        this._length = length;
    }

    get length(){
        return this._length
    }

    set length(length){
        this._length = length;
        if (length > this._array.length) {
            this._array.length = length;
        }
    }
    get value(){
        return this._array;
    }
    get (index){
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number.lessThan('index', index, this._array.length);
        //>>includeEnd('debug');

        return this._array[index];
    }

    set(index, element){
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('index', index);
        //>>includeEnd('debug');

        if (index >= this.length) {
            this.length = index + 1;
        }
        this._array[index] = element;
    }

    peek(){
        return this._array[this._length - 1];
    }

    /**
     * Push an element into the array.
     *
     * @param {*} element The element to push.
     */
    push (element) {
        var index = this.length++;
        this._array[index] = element;
    }

    /**
     * Pop an element from the array.
     *
     * @returns {*} The last element in the array.
     */
    pop () {
        return this._array[--this.length];
    }

    /**
     * Resize the internal array if length > _array.length.
     *
     * @param {Number} length The length.
     */
    reserve (length) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number.greaterThanOrEquals('length', length, 0);
        //>>includeEnd('debug');

        if (length > this._array.length) {
            this._array.length = length;
        }
    }

    /**
     * Resize the array.
     *
     * @param {Number} length The length.
     */
    resize (length) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number.greaterThanOrEquals('length', length, 0);
        //>>includeEnd('debug');

        this.length = length;
    }

    /**
     * Trim the internal array to the specified length. Defaults to the current length.
     *
     * @param {Number} [length] The length.
     */
    trim (length) {
        length = defaultValue(length, this.length);
        this._array.length = length;
    }

}
