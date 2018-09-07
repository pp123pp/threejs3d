export function getElement(element) {
    if (typeof element === 'string') {
        var foundElement = document.getElementById(element);

        //>>includeStart('debug', pragmas.debug);
        if (foundElement === null) {
            throw new DeveloperError('Element with id "' + element + '" does not exist in the document.');
        }
        //>>includeEnd('debug');

        element = foundElement;
    }
    return element;
}
