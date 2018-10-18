
export default class FrameState {
    constructor(context, creditDisplay, jobScheduler){
        /**
         * The rendering context.
         *
         * @type {Context}
         */
        this.context = context;

        this.camera = null;

        /**
         * The current frame number.
         *
         * @type {Number}
         * @default 0
         */
        this.frameNumber = 0;

        /**
         * The maximum screen-space error used to drive level-of-detail refinement.  Higher
         * values will provide better performance but lower visual quality.
         *
         * @type {Number}
         * @default 2
         */
        this.maximumScreenSpaceError = undefined;

        this.passes = {
            /**
             * <code>true</code> if the primitive should update for a render pass, <code>false</code> otherwise.
             *
             * @type {Boolean}
             * @default false
             */
            render : false,

            /**
             * <code>true</code> if the primitive should update for a picking pass, <code>false</code> otherwise.
             *
             * @type {Boolean}
             * @default false
             */
            pick : false,
        };

        /**
         * The current scene background color
         *
         * @type {Color}
         */
        this.backgroundColor = undefined;
    }
}
