import {defaultValue} from "./defaultValue";
import {TimeStandard} from "./TimeStandard";
import {TimeConstants} from "./TimeConstants";


function setComponents(wholeDays, secondsOfDay, julianDate) {
    var extraDays = (secondsOfDay / TimeConstants.SECONDS_PER_DAY) | 0;
    wholeDays += extraDays;
    secondsOfDay -= TimeConstants.SECONDS_PER_DAY * extraDays;
    
    if (secondsOfDay < 0) {
        wholeDays--;
        secondsOfDay += TimeConstants.SECONDS_PER_DAY;
    }
    
    julianDate.dayNumber = wholeDays;
    julianDate.secondsOfDay = secondsOfDay;
    return julianDate;
}

function convertUtcToTai(julianDate) {
    //Even though julianDate is in UTC, we'll treat it as TAI and
    //search the leap second table for it.
    binarySearchScratchLeapSecond.julianDate = julianDate;
    var leapSeconds = JulianDate.leapSeconds;
    var index = binarySearch(leapSeconds, binarySearchScratchLeapSecond, compareLeapSecondDates);
    
    if (index < 0) {
        index = ~index;
    }
    
    if (index >= leapSeconds.length) {
        index = leapSeconds.length - 1;
    }
    
    var offset = leapSeconds[index].offset;
    if (index > 0) {
        //Now we have the index of the closest leap second that comes on or after our UTC time.
        //However, if the difference between the UTC date being converted and the TAI
        //defined leap second is greater than the offset, we are off by one and need to use
        //the previous leap second.
        var difference = JulianDate.secondsDifference(leapSeconds[index].julianDate, julianDate);
        if (difference > offset) {
            index--;
            offset = leapSeconds[index].offset;
        }
    }
    
    JulianDate.addSeconds(julianDate, offset, julianDate);
}

export default class JulianDate {
    constructor(julianDayNumber, secondsOfDay, timeStandard){
        /**
         * Gets or sets the number of whole days.
         * @type {Number}
         */
        this.dayNumber = undefined;
    
        /**
         * Gets or sets the number of seconds into the current day.
         * @type {Number}
         */
        this.secondsOfDay = undefined;
    
        julianDayNumber = defaultValue(julianDayNumber, 0.0);
        secondsOfDay = defaultValue(secondsOfDay, 0.0);
        timeStandard = defaultValue(timeStandard, TimeStandard.UTC);
    
        //If julianDayNumber is fractional, make it an integer and add the number of seconds the fraction represented.
        var wholeDays = julianDayNumber | 0;
        secondsOfDay = secondsOfDay + (julianDayNumber - wholeDays) * TimeConstants.SECONDS_PER_DAY;
    
        setComponents(wholeDays, secondsOfDay, this);
    
        if (timeStandard === TimeStandard.UTC) {
            convertUtcToTai(this);
        }
    }
}
