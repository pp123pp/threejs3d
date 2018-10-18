
export default class DefaultProxy {
    constructor(proxy) {
        this.proxy = proxy;
    }

    getURL(resource){
        let prefix = this.proxy.indexOf('?') === -1 ? '?' : '';
        return this.proxy + prefix + encodeURIComponent(resource);
    }

}
