var getTimestamp;

if (typeof performance !== 'undefined' && typeof performance.now === 'function' && isFinite(performance.now())) {
    getTimestamp = function() {
        return performance.now();
    };
} else {
    getTimestamp = function() {
        return Date.now();
    };
}

export {getTimestamp}
