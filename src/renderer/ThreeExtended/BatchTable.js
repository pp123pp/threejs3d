const textDecoder = new TextDecoder('utf-8');

export default {
    parse(buffer) {
        const content = textDecoder.decode(new Uint8Array(buffer));
        return JSON.parse(content);
    },
};
