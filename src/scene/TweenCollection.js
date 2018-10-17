import {defaultValue} from "../core/defaultValue";
import DeveloperError from "../core/DeveloperError";
import * as TweenJS from '@tweenjs/tween.js'
import {clone} from "../core/clone";
import {defined} from "../core/defined";
import {TimeConstants} from "../core/TimeConstants";
import {EasingFunction} from "../core/EasingFunction";
import {getTimestamp} from "../core/getTimestamp";


class Tween {
    constructor(tweens, tweenjs, startObject, stopObject, duration, delay, easingFunction, update, complete, cancel){
        this._tweens = tweens;
        this._tweenjs = tweenjs;

        this._startObject = clone(startObject);
        this._stopObject = clone(stopObject);

        this._duration = duration;
        this._delay = delay;
        this._easingFunction = easingFunction;

        this._update = update;
        this._complete = complete;

        /**
         * The callback to call if the tween is canceled either because {@link Tween#cancelTween}
         * was called or because the tween was removed from the collection.
         *
         * @type {TweenCollection~TweenCancelledCallback}
         */
        this.cancel = cancel;

        /**
         * @private
         */
        this.needsStart = true;
    }

    cancelTween(){
        this._tweens.remove(this);
    }

    get startObject(){
        return this._startObject;
    }

    get stopObject(){
        return this._stopObject;
    }

    get duration(){
        return this._duration;
    }

    get delay(){
        return this._delay;
    }

    get easingFunction(){
        return this._easingFunction;
    }

    get update(){
        return this._update;
    }

    get complete(){
        return this._complete;
    }

    get tweenjs(){
        return this._tweenjs;
    }

}

export default class TweenCollection {
    constructor(){
        this._tweens = [];
    }

    add(options){
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        //>>includeStart('debug', pragmas.debug);
        if (!defined(options.startObject) || !defined(options.stopObject)) {
            throw new DeveloperError('options.startObject and options.stopObject are required.');
        }

        if (!defined(options.duration) || options.duration < 0.0) {
            throw new DeveloperError('options.duration is required and must be positive.');
        }
        //>>includeEnd('debug');

        if (options.duration === 0.0) {
            if (defined(options.complete)) {
                options.complete();
            }
            return new Tween(this);
        }

        var duration = options.duration / TimeConstants.SECONDS_PER_MILLISECOND;
        var delayInSeconds = defaultValue(options.delay, 0.0);
        var delay = delayInSeconds / TimeConstants.SECONDS_PER_MILLISECOND;
        var easingFunction = defaultValue(options.easingFunction, EasingFunction.LINEAR_NONE);

        var value = options.startObject;
        var tweenjs = new TweenJS.Tween(value);
        tweenjs.to(clone(options.stopObject), duration);
        tweenjs.delay(delay);
        tweenjs.easing(easingFunction);
        if (defined(options.update)) {
            tweenjs.onUpdate(function() {
                options.update(value);
            });
        }
        tweenjs.onComplete(defaultValue(options.complete, null));
        tweenjs.repeat(defaultValue(options._repeat, 0.0));

        var tween = new Tween(this, tweenjs, options.startObject, options.stopObject, options.duration, delayInSeconds, easingFunction, options.update, options.complete, options.cancel);
        this._tweens.push(tween);
        return tween;
    }

    addProperty(options){
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var object = options.object;
        var property = options.property;
        var startValue = options.startValue;
        var stopValue = options.stopValue;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(object) || !defined(options.property)) {
            throw new DeveloperError('options.object and options.property are required.');
        }
        if (!defined(object[property])) {
            throw new DeveloperError('options.object must have the specified property.');
        }
        if (!defined(startValue) || !defined(stopValue)) {
            throw new DeveloperError('options.startValue and options.stopValue are required.');
        }
        //>>includeEnd('debug');

        function update(value) {
            object[property] = value.value;
        }

        return this.add({
            startObject : {
                value : startValue
            },
            stopObject : {
                value : stopValue
            },
            duration : defaultValue(options.duration, 3.0),
            delay : options.delay,
            easingFunction : options.easingFunction,
            update : update,
            complete : options.complete,
            cancel : options.cancel,
            _repeat : options._repeat
        });
    }

    addAlpha(options){
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var material = options.material;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(material)) {
            throw new DeveloperError('options.material is required.');
        }
        //>>includeEnd('debug');

        var properties = [];

        for (var property in material.uniforms) {
            if (material.uniforms.hasOwnProperty(property) &&
                defined(material.uniforms[property]) &&
                defined(material.uniforms[property].alpha)) {
                properties.push(property);
            }
        }

        //>>includeStart('debug', pragmas.debug);
        if (properties.length === 0) {
            throw new DeveloperError('material has no properties with alpha components.');
        }
        //>>includeEnd('debug');

        function update(value) {
            var length = properties.length;
            for (var i = 0; i < length; ++i) {
                material.uniforms[properties[i]].alpha = value.alpha;
            }
        }

        return this.add({
            startObject : {
                alpha : defaultValue(options.startValue, 0.0)  // Default to fade in
            },
            stopObject : {
                alpha : defaultValue(options.stopValue, 1.0)
            },
            duration : defaultValue(options.duration, 3.0),
            delay : options.delay,
            easingFunction : options.easingFunction,
            update : update,
            complete : options.complete,
            cancel : options.cancel
        });
    }

    addOffsetIncrement(options){
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var material = options.material;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(material)) {
            throw new DeveloperError('material is required.');
        }
        if (!defined(material.uniforms.offset)) {
            throw new DeveloperError('material.uniforms must have an offset property.');
        }
        //>>includeEnd('debug');

        var uniforms = material.uniforms;
        return this.addProperty({
            object : uniforms,
            property : 'offset',
            startValue : uniforms.offset,
            stopValue :  uniforms.offset + 1,
            duration : options.duration,
            delay : options.delay,
            easingFunction : options.easingFunction,
            update : options.update,
            cancel : options.cancel,
            _repeat : Infinity
        });
    }

    remove(tween){
        if (!defined(tween)) {
            return false;
        }

        var index = this._tweens.indexOf(tween);
        if (index !== -1) {
            tween.tweenjs.stop();
            if (defined(tween.cancel)) {
                tween.cancel();
            }
            this._tweens.splice(index, 1);
            return true;
        }

        return false;
    }

    removeAll(){
        var tweens = this._tweens;

        for (var i = 0; i < tweens.length; ++i) {
            var tween = tweens[i];
            tween.tweenjs.stop();
            if (defined(tween.cancel)) {
                tween.cancel();
            }
        }
        tweens.length = 0;
    }

    contains(tween){
        return defined(tween) && (this._tweens.indexOf(tween) !== -1);
    }

    get(index) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(index)) {
            throw new DeveloperError('index is required.');
        }
        //>>includeEnd('debug');

        return this._tweens[index];
    }

    update(time) {
        var tweens = this._tweens;

        var i = 0;
        time = defined(time) ? time / TimeConstants.SECONDS_PER_MILLISECOND : getTimestamp();
        while (i < tweens.length) {
            var tween = tweens[i];
            var tweenjs = tween.tweenjs;

            if (tween.needsStart) {
                tween.needsStart = false;
                tweenjs.start(time);
            } else if (tweenjs.update(time)) {
                i++;
            } else {
                tweenjs.stop();
                tweens.splice(i, 1);
            }
        }
    }

    get length(){
        return this._tweens.length;
    }
}






