import { TextureLoader } from 'three';

const textureLoader = new TextureLoader();

function checkResponse(response) {
    if(response.ok) return;

    var error = new Error(`Error loading ${response.url}: status ${response.status}`);
    error.status = response.status;
    throw error;

}

export default {
    /**
     * 请求json数据
     * @param url
     * @param options
     * @returns {Promise<Response | never>}
     */
    json(url, options = {}){
        return fetch(url, options).then(response => {
            checkResponse(response);
            return response.json()
        })
    },

    /**
     * 请求二进制数据
     * @param url
     * @param options
     * @returns {Promise<ArrayBuffer | never>}
     */
    arrayBuffer(url, options = {}){
        return fetch(url, options).then((response) => {
            checkResponse(response);
            return response.arrayBuffer();
        });
    }
}
