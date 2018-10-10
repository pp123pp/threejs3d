/**
 * 请求状态
 * @type {{}}
 */
const RequestState = {

    /**
     * 请求的初始未发送状态
     */
    UNISSUED: 0,

    /**
     * 请求已生成，但并未发送
     */
    ISSUED: 1,

    /**
     * http请求已经发送
     */
    ACTIVE: 2,

    /**
     * 请求已成功
     */
    RECEIVED: 3,

    /**
     * 由于优先级较低，请求已明确或者自动取消
     */
    CANCELLED: 4,

    /**
     * 请求失败
     */
    FAILED: 5
};

export {RequestState}
