
export default class LeapSecond {
    constructor(date, offset){
        /**
         * Gets or sets the date at which this leap second occurs.
         * @type {JulianDate}
         */
        this.julianDate = date;
    
        /**
         * Gets or sets the cumulative number of seconds between the UTC and TAI time standards at the time
         * of this leap second.
         * @type {Number}
         */
        this.offset = offset;
    }
}
