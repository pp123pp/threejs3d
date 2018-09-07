import {defined} from "./defined";

export default class DeveloperError {
    constructor(message){
        /**
         * 'DeveloperError' indicating that this exception was thrown due to a developer error.
         * @type {String}
         * @readonly
         */
        this.name = 'DeveloperError';

        /**
         * The explanation for why this exception was thrown.
         * @type {String}
         * @readonly
         */
        this.message = message;

        //Browsers such as IE don't have a stack property until you actually throw the error.
        var stack;
        try {
            throw new Error();
        } catch (e) {
            stack = e.stack;
        }

        /**
         * The stack trace of this exception, if available.
         * @type {String}
         * @readonly
         */
        this.stack = stack;

        if (defined(Object.create)) {
            this.prototype = Object.create(Error.prototype);
        }
    }

    toString(){
        var str = this.name + ': ' + this.message;

        if (defined(this.stack)) {
            str += '\n' + this.stack.toString();
        }

        return str;
    }

    /**
     * @private
     */
    static throwInstantiationError(){
        throw new DeveloperError('This function defines an interface and should not be called directly.');
    }
}



