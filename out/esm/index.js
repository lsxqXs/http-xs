const asyncResolve = Promise.resolve.bind(Promise);
const asyncReject = Promise.reject.bind(Promise);
const toTypeString = Object.prototype.toString;
function valueOf(tar) {
    return toTypeString.call(tar).slice(8, -1);
}
const hasInType = (target, type) => type === valueOf(target);
function isObject(tar) {
    return hasInType(tar, "Object");
}
function isFunction(tar) {
    return typeof tar === "function";
}
function isAsyncFunction(tar) {
    return valueOf(tar) === "AsyncFunction";
}
function isStream(tar) {
    return isObject(tar) && typeof isFunction(tar.pipe);
}
function isArray(tar) {
    return Array.isArray(tar);
}
const isNodePlatform = typeof process !== "undefined" && valueOf(process) === "process";
function isAbsoluteURL(url) {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
function isNil(tar) {
    return tar === null || tar === undefined;
}
/**
 *
 * @param tar any
 * @returns boolean
 * @description null undefined length size size() keys
 */
function isEmpty(tar) {
    if (isNil(tar)) {
        return true;
    }
    try {
        if (Number.isInteger(tar.length)) {
            return tar.length === 0;
        }
        if ("size" in tar) {
            return isFunction(tar.size) ? tar.size() === 0 : tar.size === 0;
        }
        if ("byteLength" in tar) {
            return tar.byteLength === 0;
        }
        if (isFunction(tar.keys)) {
            return tar.keys().length === 0;
        }
        return Object.keys(tar).length === 0;
    }
    catch (error) {
        if (typeof tar === "boolean") {
            return false;
        }
        if (typeof tar === "number") {
            return tar === 0;
        }
        return false;
    }
}
function forEach(target, each) {
    if (isNil(target)) {
        return;
    }
    if ("forEach" in target) {
        return target.forEach(each);
    }
    if (isObject(target)) {
        return Object.entries(target).forEach(([key, value]) => each(key, value));
    }
    for (let [key, val] of target) {
        each(key, val);
    }
}

/**
 * 将`content-type` 转换为 `Content-Type`
 * @param name key
 * @returns key
 */
function toCamelCase(name) {
    if (typeof name !== "string") {
        name = name.toString();
    }
    let nextKey = name.charAt(0).toUpperCase();
    let prev = nextKey;
    for (let i = 1; i < name.length; i++) {
        let el = name.charAt(i).toLowerCase();
        if (prev === "-") {
            el = el.toUpperCase();
        }
        nextKey += el;
        prev = el;
    }
    return nextKey;
}
class XsHeaders {
    constructor(init) {
        let initialize = {};
        XsHeaders.forEach(init, (k, v) => {
            initialize[k] = v;
        });
        this.urlSearchParams = new URLSearchParams(initialize);
    }
    static forEach(init, each) {
        if (isNil(init)) {
            return;
        }
        if (valueOf(init) === "Headers" || init instanceof XsHeaders) {
            init.forEach((v, k) => each(toCamelCase(k), v));
            return;
        }
        if (isObject(init)) {
            init = Object.entries(init);
        }
        if (typeof (init === null || init === void 0 ? void 0 : init.forEach) === "function") {
            init.forEach(([k, v]) => {
                each(toCamelCase(k), v);
            });
        }
    }
    /**
     * 是否是json类型
     * @param src stirng
     * @returns boolean
     */
    static isJSON(src) {
        return src === null || src === void 0 ? void 0 : src.includes("application/json");
    }
    static isPlainText(src) {
        return src === null || src === void 0 ? void 0 : src.includes("text/plain");
    }
    /**
     * 返回 "Content-Type": "application/json; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static json(init) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.json);
        return nextHeader;
    }
    /**
    * 返回 "Content-Type": "multipart/form-data" 的headers
    * @param init HeaderEntries
    * @returns XsHeaderImpl
    */
    static formData(init) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.formData);
        return nextHeader;
    }
    /**
     * 返回  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static form(init) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.form);
        return nextHeader;
    }
    /**
     * 返回 "Content-Type": "text/plain; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static text(init) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.text);
        return nextHeader;
    }
    *keys() {
        let ks = this.urlSearchParams.keys();
        for (let k of ks) {
            yield k;
        }
    }
    *values() {
        let ks = this.urlSearchParams.values();
        for (let k of ks) {
            yield k;
        }
    }
    empty() {
        return Array.from(this.keys()).length === 0;
    }
    toString() {
        return Object.prototype.toString.call(this);
    }
    get [Symbol.toStringTag]() {
        return "XsHeaders";
    }
    *[Symbol.iterator]() {
        for (let el of Object.entries(this.raw())) {
            yield el;
        }
    }
    raw() {
        let ans = {};
        this.urlSearchParams.forEach(function each(val, key) {
            ans[key] = val;
        });
        return ans;
    }
    get(name) {
        let ans = this.urlSearchParams.get(toCamelCase(name));
        return ans !== null && ans !== void 0 ? ans : null;
    }
    set(name, value) {
        return this.urlSearchParams.set(toCamelCase(name), value);
    }
    append(name, value) {
        return this.urlSearchParams.append(toCamelCase(name), value);
    }
    has(name) {
        return this.urlSearchParams.has(toCamelCase(name));
    }
    delete(name) {
        return this.urlSearchParams.delete(toCamelCase(name));
    }
    forEach(callbackfn, thisArg) {
        return this.urlSearchParams.forEach(callbackfn, thisArg);
    }
}
XsHeaders.contentType = "Content-Type";
XsHeaders.type = {
    json: "application/json; charset=UTF-8",
    text: "text/plain; charset=UTF-8",
    form: "application/x-www-form-urlencoded; charset=UTF-8",
    formData: "multipart/form-data"
};

function mergeConfig(url, options, method) {
    const completeOpts = {};
    if (typeof url === "string") {
        completeOpts.url = url;
    }
    const each = (key, val) => {
        if (key === "headers") {
            let header = completeOpts.headers = new XsHeaders();
            XsHeaders.forEach(val, (k, v) => {
                header.set(k, v);
            });
            return;
        }
        if (isArray(val)) {
            let exist = completeOpts[key];
            if (!isArray(exist)) {
                exist = completeOpts[key] = [];
            }
            val.forEach(v => exist.push(v));
            return;
        }
        // 数组的情况
        completeOpts[key] = val;
    };
    if (isObject(url)) {
        forEach(url, each);
    }
    if (isObject(options)) {
        forEach(options, each);
    }
    if (!isNil(method)) {
        completeOpts.method = method;
    }
    return completeOpts;
}

const notRequireBody = "get,head,trace";
function bindBaseRequest(fetchRemote, mergedConfig) {
    async function runWithExecuting(fn) {
        try {
            executor.executing = true;
            return await fn();
        }
        finally {
            executor.executing = false;
        }
    }
    async function executor(payload, nextConfig) {
        return runWithExecuting(() => {
            let config = mergeConfig(mergedConfig, nextConfig);
            if (!isNil(payload)) {
                if (notRequireBody.includes(config.method)) {
                    config.query = payload;
                }
                else {
                    config.body = payload;
                }
            }
            return fetchRemote(config);
        });
    }
    executor.send = async function request(nextConfig) {
        return executor(null, nextConfig);
    };
    executor.match = async function match(matcher, nextConfig) {
        return runWithExecuting(async () => {
            let config = mergeConfig(mergedConfig, nextConfig);
            config.queryMatch = matcher;
            return fetchRemote(config);
        });
    };
    executor.query = async function query(payload, nextConfig) {
        return runWithExecuting(async () => {
            let config = mergeConfig(mergedConfig, nextConfig);
            config.query = payload;
            return fetchRemote(config);
        });
    };
    executor.mutation = async function (data, nextConfig) {
        return runWithExecuting(async () => {
            let config = mergeConfig(mergedConfig, nextConfig);
            config.body = data;
            return fetchRemote(config);
        });
    };
    executor.executing = false;
    return executor;
}
function define(exec, defines) {
    let entries = Object.entries(defines);
    let define = {};
    for (let [key, def] of entries) {
        let method = def.method;
        define[key] = bindBaseRequest(typeof exec === "function" ? exec : exec[method], def);
    }
    return define;
}
/**
 * 接受一个实例，返回一个函数，函数中使用实例中的方法
 * @param baseRequest {get, post, put...}
 * @returns define.bind(this,baseRequest)
 */
function useRequest(baseRequest) {
    return define.bind(this, baseRequest);
}

function encode(input) {
    try {
        return encodeURIComponent(input)
            .replace(/%3A/gi, ":")
            .replace(/%24/g, "$")
            .replace(/%2C/gi, ",")
            .replace(/%22/gi, "")
            .replace(/%20/g, "+")
            .replace(/%5B/gi, "[")
            .replace(/%5D/gi, "]");
    }
    catch (e) {
        console.error(input.toString() + e);
        return input.toString();
    }
}
const querySerializerMap = {
    "String": query => query.replace(/^\?*/, "").replace(/&[\w\W]=$/, ""),
    "URLSearchParams": query => query.toString(),
    "Object": query => {
        let queryList = [];
        function buildObject(obj, ks) {
            if (Array.isArray(obj)) {
                for (let el of obj) {
                    let nextKey = ks;
                    buildObject(el, nextKey);
                    // queryList.push(`${encode(nextKey as string)}=${encode(v as string)}`);
                }
                return;
            }
            if (isObject(obj)) {
                let kpath = ks;
                for (let k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        let nextKey = kpath + "[" + k + "]";
                        buildObject(obj[k], nextKey);
                    }
                }
                return;
            }
            queryList.push(`${encode(ks)}=${encode(obj)}`);
        }
        function each(key, val) {
            if (val === null || val === "undfefined") {
                return;
            }
            let valType = valueOf(val);
            switch (valType) {
                case "Date":
                    val = val.toISOString();
                    break;
                case "URLSearchParams":
                    for (let [k, v] of val.entries()) {
                        // queryList.push(`${encode(`${key}`)}=${encode(val as string)}`);
                        buildObject(v, `${key}[${k}]`);
                    }
                    return;
                case "Array":
                case "Object":
                    buildObject(val, key);
                    return;
                default:
                    if (isEmpty(val)) {
                        val = "";
                    }
                    else {
                        val = val === null || val === void 0 ? void 0 : val.toString();
                    }
                    break;
            }
            queryList.push(`${encode(key)}=${encode(val)}`);
        }
        forEach(query, each);
        return queryList.length > 0 ? `?${queryList.join("&")}` : "";
    }
};
function urlQuerySerialize(originalUrl = "", opts) {
    let sourceQuery = opts.query;
    if (!isAbsoluteURL(originalUrl)) {
        originalUrl = originalUrl.replace(/^\/*/, "/").replace(/\/*$/, "").replace(/\s*/g, "");
    }
    let hasUrlInQuery = originalUrl.lastIndexOf("?") !== -1;
    if (!isNil(sourceQuery)) {
        let nextQueryRaw = "";
        // query -> urlSearchParams
        // query -> string
        // query -> dict
        let sourceQueryType = valueOf(sourceQuery);
        let serialize = querySerializerMap[sourceQueryType];
        nextQueryRaw = serialize(sourceQuery);
        originalUrl += hasUrlInQuery ? "&" : `${nextQueryRaw}`;
    }
    let queryMatch = opts.queryMatch;
    if (Array.isArray(queryMatch)) {
        let matcherUrl = originalUrl.slice(0, originalUrl.indexOf("{") - 1);
        let matcher = null;
        let matchRe = /{[\w]+}/g;
        let end = originalUrl.length;
        let start = end;
        while ((matcher = matchRe.exec(originalUrl)) !== null) {
            matcherUrl += `/${queryMatch.shift()}`;
            start = matcher[0].length + matcher.index;
            /* eslint-disable  @typescript-eslint/no-unused-vars  */
            matcher = null;
        }
        originalUrl = matcherUrl + originalUrl.slice(start, end);
    }
    return originalUrl;
}
function transfromRequestPayload(opts) {
    let body = opts.body;
    /* eslint-disable eqeqeq */
    if (body == null) {
        return null;
    }
    let header = opts.headers;
    let headerContentType = header.get(XsHeaders.contentType), replaceContentType = headerContentType;
    switch (valueOf(body).toLowerCase()) {
        case "array":
        case "urlsearchparams":
        case "object": {
            if (XsHeaders.isJSON(replaceContentType) &&
                (isObject(body) || Array.isArray(body))) {
                body = JSON.stringify(body);
            }
            else {
                body = new URLSearchParams(body).toString();
            }
            if (isNodePlatform) {
                body = Buffer.from(body, "utf-8");
            }
            replaceContentType = XsHeaders.type.form;
            break;
        }
        case "string":
            replaceContentType = XsHeaders.type.text;
            break;
        case "arraybuffer": {
            if (isNodePlatform) {
                body = Buffer.from(new Uint8Array(body));
            }
            break;
        }
        case "formdata": {
            replaceContentType = headerContentType = null;
            header.delete(XsHeaders.contentType);
        }
    }
    if (isEmpty(headerContentType) && !isEmpty(replaceContentType)) {
        header.set(XsHeaders.contentType, replaceContentType);
    }
    opts.headers = header;
    return body;
}
function transfromResponse(responseStruct, responseType) {
    var _a;
    let response = (_a = responseStruct.response) !== null && _a !== void 0 ? _a : "";
    switch (responseType === null || responseType === void 0 ? void 0 : responseType.toLowerCase()) {
        case "blob":
        case "stream":
        case "buffer":
            break;
        case "u8array":
            response = new Uint8Array(response);
            break;
        case "arraybuffer":
            if (isNodePlatform) {
                response = response.buffer;
            }
            break;
        case "text":
        case "utf8":
            if (isNodePlatform && Buffer.isBuffer(response)) {
                response = response.toString("utf-8");
                break;
            }
        case "json":
            if (!isNodePlatform) {
                break;
            }
            if (Buffer.isBuffer(response)) {
                response = response.toString("utf-8");
            }
            try {
                response = JSON.parse(response);
                break;
            }
            catch (error) {
                throw Error("responseType is not support");
            }
        default: {
            const contentType = responseStruct.headers.get(XsHeaders.contentType);
            if (XsHeaders.isJSON(contentType) && typeof response === "string") {
                response = JSON.parse(response);
            }
            if (isNodePlatform && Buffer.isBuffer(response)) {
                response = response.toString("utf-8");
            }
        }
    }
    responseStruct.response = response;
    return responseStruct;
}

function compose(fns = []) {
    return function execute(req, finished) {
        let index = -1;
        let processNextArg = req;
        function run(i) {
            let fn = fns[i];
            let nextCallback = () => {
                nextCallback = null;
                return run(i + 1);
            };
            if (i <= index) {
                return asyncReject(new Error("next() called"));
            }
            if (fns.length === i) {
                return finished(processNextArg);
            }
            if (typeof fn !== "function") {
                return asyncResolve(processNextArg);
            }
            const promessHanlder = (next) => {
                if (next !== undefined) {
                    processNextArg = next;
                }
                return typeof nextCallback === "function" ? nextCallback() : processNextArg;
            };
            return asyncResolve(fn(processNextArg, nextCallback))
                .then(promessHanlder)
                .catch(promessHanlder)
                .catch(e => asyncReject(promessHanlder(e)));
        }
        return run(0);
    };
}

function validateCode(status) {
    return status >= 200 && status < 300;
}
function validateFetchStatus(status, resolve, reject) {
    return validateCode(status) ? resolve : reject;
}
class XsError extends Error {
    constructor(status, message, completeConfig, headers = new XsHeaders(), type = "default") {
        super(message);
        this.status = status;
        this.message = message;
        this.completeConfig = completeConfig;
        this.headers = headers;
        this.type = type;
        this.response = null;
        this.ok = false;
        this.code = 0;
    }
    get timeout() {
        return typeof this.completeConfig.timeout === "number" ? this.completeConfig.timeout : null;
    }
    toString() {
        return this.message;
    }
    stringify() {
        return JSON.stringify(this, null, 4);
    }
    toJson() {
        return JSON.parse(JSON.stringify(this, null, 4));
    }
}
class ResponseStruct {
    constructor(complete, originalResponseBody, status, message, completeConfig, type = "default", headers = new XsHeaders()) {
        this.status = status;
        this.message = message;
        this.completeConfig = completeConfig;
        this.type = type;
        this.headers = headers;
        this.ok = false;
        this.response = originalResponseBody;
        this.ok = validateCode(status);
        complete(this);
    }
    get timeout() {
        return typeof this.completeConfig.timeout === "number" ? this.completeConfig.timeout : null;
    }
    // get ok() {
    //   return validateCode(this.status);
    // }
    refetch(opts) {
        this.completeConfig = mergeConfig(opts, this.completeConfig);
        return exectionOfSingleRequest(this.completeConfig);
    }
}

class XsEventTarget {
    constructor() {
        let EventEmitter = require("events");
        this.events = new EventEmitter();
    }
    /* eslint-disable @typescript-eslint/no-unused-vars */
    addEventListener(type, listener, ...args) {
        this.events.once(type, listener);
    }
    dispatchEvent(event) {
        this.events.emit(event);
    }
    removeEventListener(type, listener) {
        this.events.removeListener(type, listener);
    }
}
function getAdapEventTarget() {
    if (typeof EventTarget !== "undefined") {
        return EventTarget;
    }
    return XsEventTarget;
}

// function Signle (this:ThisType<Object>) {
//   getAdapEventTarget().call(this);
//   (this as any).aborted = false;
//   (this as any).onabort = null;
// }
// Signle.prototype.addEventListener = function (type: keyof AbortSignalEventMap, listener: (...args)=>void) {
//   this.addEventListener(type, listener);
// }
class Signal extends getAdapEventTarget() {
    constructor() {
        super(...arguments);
        this.aborted = false;
    }
    addEventListener(type, listener) {
        super.addEventListener(type, listener);
    }
    dispatchEvent(event) {
        var _a;
        super.dispatchEvent(event);
        (_a = this.onabort) === null || _a === void 0 ? void 0 : _a.call(this, event);
    }
    removeEventListener(type, listener) {
        super.removeEventListener(type, listener);
    }
    subscribe(listener) {
        super.addEventListener("abort", listener);
    }
}

class XsEvent {
    constructor(eventName) {
        this.isXsEvent = true;
        this.type = eventName;
    }
}
function getAdaptEvent() {
    if (typeof Event !== "undefined") {
        return new Event("abort");
    }
    return new XsEvent("abort");
}

class XsCancel {
    constructor() {
        this.signal = new Signal();
    }
    abort() {
        if (this.signal.aborted) {
            return;
        }
        this.signal.dispatchEvent(getAdaptEvent());
        this.signal.aborted = true;
    }
}

/**
 * 返回时的状态
 */
const pw = Math.pow(2, 31) - 10000;
/**
 * 请求处理的状态码
 */
var HttpStatusException;
(function (HttpStatusException) {
    HttpStatusException[HttpStatusException["Cancel"] = pw >> 2] = "Cancel";
    HttpStatusException[HttpStatusException["Timeout"] = pw >> 3] = "Timeout";
    HttpStatusException[HttpStatusException["Error"] = pw >> 4] = "Error";
    HttpStatusException[HttpStatusException["Success"] = 200] = "Success";
})(HttpStatusException || (HttpStatusException = {}));

const each = (init, line) => {
    let [key, val] = line.split(":");
    init[key] = val.trim();
    return init;
};
function parserRawHeader(xhr) {
    var _a;
    let head;
    let h = ((_a = xhr.getAllResponseHeaders()) !== null && _a !== void 0 ? _a : "").trim();
    if (h.length > 0) {
        head = h.split(/\r\n/).reduce(each, {});
    }
    return new XsHeaders(head);
}
function xhrRequest(opts) {
    var _a, _b;
    let xhr = new globalThis.XMLHttpRequest();
    if (typeof opts.responseType === "string") {
        xhr.responseType = opts.responseType.toLocaleLowerCase();
    }
    xhr.open(opts.method.toLocaleUpperCase(), opts.url, true, (_a = opts === null || opts === void 0 ? void 0 : opts.auth) === null || _a === void 0 ? void 0 : _a.username, (_b = opts === null || opts === void 0 ? void 0 : opts.auth) === null || _b === void 0 ? void 0 : _b.password);
    opts.headers.forEach(function each(val, key) { xhr.setRequestHeader(key, val); });
    if (typeof opts.timeout === "number" && !Number.isNaN(opts.timeout)) {
        xhr.timeout = opts.timeout;
    }
    if (typeof opts.withCredentials === "boolean") {
        xhr.withCredentials = opts.withCredentials;
    }
    if (typeof opts.onProgress === "function") {
        xhr.onprogress = opts.onProgress;
    }
    if (typeof opts.onUploadProgress === "function") {
        xhr.upload.onprogress = opts.onUploadProgress;
    }
    if (typeof opts.cancel !== "undefined") {
        let abort = function () {
            opts.cancel.signal.removeEventListener("abort", abort);
            if (opts.cancel.signal.aborted) {
                return;
            }
            xhr.abort();
            abort = null;
        };
        opts.cancel.signal.addEventListener("abort", abort, { once: true });
    }
    return new Promise(function executor(resolve, reject) {
        xhr.onabort = function onAbort() {
            reject(new XsError(HttpStatusException.Cancel, "[Http-Xs]: Client Aborted", opts, parserRawHeader(xhr), "abort"));
            xhr = null;
        };
        xhr.ontimeout = function onTimeout() {
            reject(new XsError(HttpStatusException.Timeout, `[Http-Xs]: Network Timeout of ${xhr.timeout}ms`, opts, parserRawHeader(xhr), "timeout"));
            xhr = null;
        };
        xhr.onerror = function onError() {
            reject(new XsError(HttpStatusException.Error, "[Http-Xs]: Network Error", opts, parserRawHeader(xhr), "error"));
            xhr = null;
        };
        xhr.onreadystatechange = function onreadystatechange() {
            if (xhr === null || this.readyState !== 4) {
                return;
            }
            if (this.responseURL.startsWith("file:") || this.status === 0) {
                return;
            }
            new ResponseStruct(validateFetchStatus(this.status, resolve, reject), this.response, this.status, this.statusText, opts, null, parserRawHeader(this));
            xhr = null;
        };
        xhr.send(opts.body);
    });
}
async function fetchRequest(opts) {
    let url = opts.url;
    let cancelController = opts.signal;
    if (typeof opts.cancel !== "undefined") {
        if (opts.cancel instanceof XsCancel) {
            cancelController = new AbortController();
            let abort = function () {
                opts.cancel.signal.removeEventListener("abort", abort);
                if (opts.cancel.signal.aborted) {
                    return;
                }
                cancelController.abort();
                abort = null;
            };
            opts.cancel.signal.addEventListener("abort", abort);
        }
        else {
            cancelController = opts.cancel;
        }
    }
    let timeoutId = null;
    if (typeof opts.timeout === "number") {
        if (typeof cancelController === "undefined") {
            cancelController = new AbortController();
        }
        timeoutId = setTimeout(function timeout() {
            cancelController.abort(Error("timeout"));
        }, opts.timeout);
    }
    let header = opts.headers;
    if (header instanceof XsHeaders) {
        header = header.raw();
    }
    let req = new globalThis.Request(url, {
        method: opts.method.toLocaleUpperCase(),
        cache: opts.cache,
        credentials: opts.credentials,
        integrity: opts.integrity,
        keepalive: opts.keepalive,
        body: opts.body,
        mode: opts.mode,
        headers: header,
        redirect: opts.redirect,
        referrer: opts.referrer,
        referrerPolicy: opts.referrerPolicy,
        signal: cancelController === null || cancelController === void 0 ? void 0 : cancelController.signal
    });
    let readBody;
    return new Promise(async (resolve, reject) => {
        try {
            readBody = await globalThis.fetch(req);
            let body = readBody.clone();
            let response = await readBody[opts.responseType]().catch(() => body.text());
            let xsHeader = new XsHeaders();
            body.headers.forEach((val, key) => xsHeader.set(key, val));
            return new ResponseStruct(validateFetchStatus(body.status, resolve, reject), response, body.status, body.statusText, opts, body.type, xsHeader);
        }
        catch (exx) {
            let header = new XsHeaders();
            // fetch 取消请求时的错误对象 —> DOMException
            if (exx instanceof DOMException) {
                if (!isNil(opts.cancel) || !isNil(opts.signal)) {
                    return reject(new XsError(HttpStatusException.Cancel, `[Http-Xs]: Client Abort ${exx.toString()}`, opts, header, "abort"));
                }
                if (timeoutId !== null) {
                    return reject(new XsError(HttpStatusException.Timeout, `[Http-Xs]: Network Timeout of ${opts.timeout}ms`, opts, header, "timeout"));
                }
            }
            return reject(new XsError(HttpStatusException.Error, `[Http-Xs]: ${exx.message}`, opts, header, "error"));
        }
        finally {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
        }
    });
}

function getRequest(type) {
    if (type === "http") {
        return require("http").request;
    }
    return require("https").request;
}
function nodeRequest(opts) {
    let body = opts.body;
    let headers = opts.headers;
    let requestOptions;
    if (typeof opts.socketPath === "string") {
        requestOptions = { socketPath: opts.socketPath };
    }
    else {
        try {
            requestOptions = require("url").urlToHttpOptions(new URL(opts.url));
        }
        catch (exx) {
            // handle parse url errx
            return asyncReject(new XsError(HttpStatusException.Error, `[Http-Xs]: Parser Url Error ${exx.toString()}`, opts, new XsHeaders(), "error"));
        }
    }
    requestOptions.method = opts.method.toLocaleUpperCase();
    if (opts.agent !== undefined) {
        requestOptions.agent = opts.agent;
    }
    if (typeof opts.maxHeaderSize === "number") {
        requestOptions.maxHeaderSize = opts.maxHeaderSize;
    }
    if (typeof opts.auth === "object") {
        requestOptions.auth = `${opts.auth.username}:${opts.auth.password}`;
    }
    requestOptions.headers = {};
    headers.forEach(function each(val, key) {
        requestOptions.headers[key] = val;
    });
    let request;
    if (/^https:?/.test(requestOptions.protocol)) {
        request = getRequest("https");
    }
    else {
        request = getRequest("http");
    }
    return new Promise(function executor(resolve, reject) {
        const req = request(requestOptions, function onRequest(res) {
            if (req.destroyed) {
                return;
            }
            let chunks = [];
            let stream = res;
            let resHeader = new XsHeaders(res.headers);
            res.on("error", function onError(err) {
                res.resume();
                return reject(new XsError(HttpStatusException.Error, `[Http-Xs]: ${err.message} ${err.stack}`, opts, resHeader, "error"));
            });
            if (typeof opts.encoding !== "undefined") {
                res.setEncoding(opts.encoding);
            }
            if (opts.responseType === "stream") {
                return new ResponseStruct(resolve, stream, res.statusCode, res.statusMessage, opts, null, resHeader);
            }
            stream.on("data", function onData(ch) {
                chunks.push(ch);
            });
            stream.on("error", function onError(exx) {
                if (req.destroyed) {
                    return;
                }
                return reject(new XsError(HttpStatusException.Error, `[Http-Xs]: ${exx.message} ${exx.stack}`, opts, resHeader, "error"));
            });
            stream.on("end", function onStreameEnd() {
                let responseBuffer = Buffer.concat(chunks);
                return new ResponseStruct(validateFetchStatus(res.statusCode, resolve, reject), responseBuffer, res.statusCode, res.statusMessage, opts, null, resHeader);
            });
        });
        req.on("error", function onError(exx) {
            if (req.destroyed) {
                return;
            }
            return reject(new XsError(HttpStatusException.Error, `[Http-Xs]: Network Error:\n${exx.message}`, opts, undefined, "error"));
        });
        if (typeof opts.timeout === "number") {
            req.setTimeout(opts.timeout, function onTimeout() {
                req.destroy();
                return reject(new XsError(HttpStatusException.Timeout, `[Http-Xs]: Network Timeout of ${opts.timeout}ms`, opts, undefined, "timeout"));
            });
        }
        if (typeof opts.cancel !== "undefined") {
            let cancel = function () {
                opts.cancel.signal.removeEventListener("abort", cancel);
                if (opts.cancel.signal.aborted) {
                    return;
                }
                req.destroy();
                cancel = null;
                return reject(new XsError(HttpStatusException.Cancel, "[Http-Xs]: Client Abort", opts, undefined, "abort"));
            };
            opts.cancel.signal.addEventListener("abort", cancel, { once: true });
        }
        req.on("abort", function onAbort() { reject(new XsError(HttpStatusException.Cancel, "[Http-Xs]: Client Abort", opts, undefined, "abort")); });
        if (isStream(body)) {
            body.on("error", function onError(exx) {
                return reject(new XsError(HttpStatusException.Error, `[Http-Xs]: Request data error\n${exx.message} ${exx.stack}`, opts, undefined, "error"));
            }).pipe(req);
        }
        else {
            req.end(body);
        }
    });
}

/**
 * 根据不同情况返回所支持的函数
 * @param config  请求配置
 * @returns request 一个用于执行请求的函数
 */
function dispatchRequest(config) {
    let existRequestMode = config.requestMode;
    let haveRequestMode = existRequestMode === "fetch" || existRequestMode === "xhr";
    // custom request
    if (typeof config.customRequest === "function") {
        return config.customRequest;
    }
    if (isNodePlatform) {
        if (typeof fetch !== "undefined") {
            if (isAsyncFunction(fetch)) {
                if (!haveRequestMode) {
                    config.requestMode = "fetch";
                }
                return fetchRequest;
            }
        }
        return nodeRequest;
    }
    if (config.requestMode === "xhr" ||
        typeof globalThis.fetch === "undefined" ||
        (typeof config.cancel !== "undefined" && typeof AbortController === "undefined") ||
        typeof config.onUploadProgress === "function" ||
        typeof config.onProgress === "function" ||
        typeof config.timeout === "number" ||
        typeof config.auth === "object") {
        config.requestMode = "xhr";
        return xhrRequest;
    }
    config.requestMode = "fetch";
    return fetchRequest;
}

function exectionOfSingleRequest(completeOpts) {
    return compose([completeOpts.interceptor].flat(3).filter(Boolean))(completeOpts, async function requestExection(options) {
        options.url = urlQuerySerialize(options.url, options);
        options.headers = new XsHeaders(options.headers);
        if (!isNil(options.body)) {
            options.body = transfromRequestPayload(options);
        }
        // 分配request
        let localRequest = dispatchRequest(options);
        let responseType = options.responseType;
        // responType为空时设置默认responseType
        if (options.requestMode === "fetch") {
            if (isNil(responseType) || responseType.trim().length === 0) {
                responseType = options.responseType = "json";
            }
        }
        try {
            // 发送请求
            let responseStruct = await localRequest(options);
            // 处理响应
            return transfromResponse(responseStruct, responseType);
        }
        catch (exx) {
            if (exx instanceof ResponseStruct) {
                return asyncReject(transfromResponse(exx, responseType));
            }
            return asyncReject(exx);
        }
    });
}

function retry(execution, retryNumer = 4) {
    return new Promise(function executor(resolve) {
        let onComplete = res => {
            if (!res.ok && retryNumer > 0) {
                retryNumer--;
                return execution().then(onComplete, onComplete);
            }
            return resolve(res);
        };
        execution().then(onComplete, onComplete);
    });
}

function executionRequest(fn, complete) {
    return fn().then(complete, complete);
}
async function asyncIterable(iterator, map) {
    if (iterator instanceof Map) {
        let promiseResult = iterator;
        return new Promise(function executor(res) {
            let i = 0, len = iterator.size;
            iterator.forEach(function each(fn, key) {
                executionRequest(fn, function onCompleate(result) {
                    promiseResult.set(key, typeof map === "function" ? map(result) : result);
                    i++;
                    if (i === len) {
                        res(promiseResult);
                    }
                });
            });
        });
    }
    let promiseResult = iterator;
    return new Promise(function executor(res) {
        let keys = Array.from(Object.keys(iterator));
        let i = 0, len = keys.length;
        while (i < len) {
            i++;
            executionRequest(iterator[keys[i]], function onCompleate(result) {
                promiseResult[keys[i]] = typeof map === "function" ? map(result) : result;
                i++;
                if (i === len) {
                    res(promiseResult);
                }
            });
        }
    });
}

const methodNamed = ["get", "post", "delete", "put", "patch", "options", "head"];
const defaultMergeKeys = "responseType, customRequest, timeout, requestMode";
function mergeDefaultInceConfig(instReq, customReq) {
    let { headers, baseUrl = "" } = instReq;
    let keys = Object.keys(instReq).filter(key => defaultMergeKeys.includes(key));
    // 实例headers属性不为空
    if (!isNil(headers)) {
        let nextHeader = new XsHeaders(headers);
        XsHeaders.forEach(customReq.headers, (k, v) => {
            nextHeader.set(k, v);
        });
        customReq.headers = nextHeader;
    }
    let inputRequrl = customReq.url;
    if (!(/^\s*https?/.test(inputRequrl))) {
        customReq.url = baseUrl + inputRequrl.replace(/^\/*/, "/");
    }
    let existsInterceptor = customReq.interceptor;
    let hasInterceptor = Array.isArray(existsInterceptor) || typeof existsInterceptor === "function";
    let del = (async (_req, next) => next().then(r => {
        if (hasInterceptor) {
            customReq.interceptor = existsInterceptor;
        }
        else {
            delete customReq.interceptor;
        }
        del = existsInterceptor = null;
        return r;
    }));
    // use
    // 构造函数中选择[interceptors]不为空
    if (Array.isArray(instReq.interceptors)) {
        customReq.interceptor = instReq.interceptors.concat(del, existsInterceptor !== null && existsInterceptor !== void 0 ? existsInterceptor : []);
    }
    keys.forEach(key => {
        let customVal = customReq[key];
        // 如果实例请求中val为nil，选用实例配置中的val
        if (isNil(customVal)) {
            customReq[key] = instReq[key];
        }
    });
    return customReq;
}
function resolveDefaultConfig(requestInstanceInterface) {
    if (!isObject(requestInstanceInterface)) {
        return {};
    }
    if (typeof requestInstanceInterface.baseUrl === "string") {
        requestInstanceInterface.baseUrl = requestInstanceInterface.baseUrl.replace(/[?/]*$/, "");
    }
    return requestInstanceInterface;
}
function createInstance(defaultInstaceConfig) {
    const fullInstceConf = resolveDefaultConfig(defaultInstaceConfig);
    const instce = Object.create(null);
    instce.baseRequestConf = fullInstceConf;
    instce.use = function use(...fns) {
        let uses = instce.baseRequestConf.interceptors;
        if (!Array.isArray(uses)) {
            uses = instce.baseRequestConf.interceptors = [];
        }
        let queue = [...fns];
        while (queue.length > 0) {
            const fn = queue[0];
            if (typeof fn === "function") {
                uses.push(fn);
            }
            else {
                queue.unshift(...fn);
            }
            queue.shift();
        }
        return this;
    };
    instce.use.delete = function deleteUseFunction(fn) {
        let used = instce.baseRequestConf.interceptors;
        if (!Array.isArray(used)) {
            return false;
        }
        let deletion = used.splice(used.indexOf(fn), 1);
        return deletion.length !== 0;
    };
    methodNamed.forEach(function each(method) {
        instce[method] = function HttpMethod(url, opts) {
            return instce.request(mergeConfig(url, opts, method));
        };
    });
    instce.setProfix = function (nextUrl, replace = false) {
        if (replace) {
            instce.baseRequestConf.baseUrl = nextUrl;
            return;
        }
        fullInstceConf.baseUrl += nextUrl.replace(/^\/*/, "/");
    };
    function instanceRequest(config) {
        let finish = mergeDefaultInceConfig(instce.baseRequestConf, config);
        return exectionOfSingleRequest(finish);
    }
    instce.define = define.bind(null, instanceRequest);
    instce.request = instanceRequest;
    instce.asyncIterable = asyncIterable;
    instce.XsCancel = XsCancel;
    instce.XsHeaders = XsHeaders;
    instce.resolve = asyncResolve;
    instce.resject = asyncReject;
    instce.each = forEach;
    instce.retry = retry;
    return instce;
}

const HttpXsDefaultProto = {
    asyncIterable: asyncIterable,
    request: exectionOfSingleRequest,
    XsCancel: XsCancel,
    XsHeaders: XsHeaders,
    resolve: asyncResolve,
    reject: asyncReject,
    each: forEach,
    retry: retry,
    define: define,
    useRequest: useRequest
};
Object.freeze(HttpXsDefaultProto);

function factoryForHttpMethod(method) {
    const httpMethod = ((url, options) => exectionOfSingleRequest(mergeConfig(url, options, method)));
    return httpMethod;
}
const Get = factoryForHttpMethod("get");
const Post = factoryForHttpMethod("post");
const Delete = factoryForHttpMethod("delete");
const Put = factoryForHttpMethod("put");
const Patch = factoryForHttpMethod("patch");
const Options = factoryForHttpMethod("options");
const Head = factoryForHttpMethod("head");

const m = {
    Get, Post, Options, Put, Delete, Patch, Head
};
const xs = Object.assign(Object.assign(Object.assign({}, HttpXsDefaultProto), { create: createInstance }), Object.keys(m).reduce((acc, cur) => {
    let nk = cur.toLocaleLowerCase();
    acc[cur] = m[cur];
    acc[nk] = m[cur];
    return acc;
}, {}));

export { Delete, Get, Head, HttpStatusException, HttpXsDefaultProto, Options, Patch, Post, Put, XsCancel, XsHeaders, asyncIterable, createInstance as create, xs as default, define, Delete as delete, Get as get, Head as head, Options as options, Patch as patch, Post as post, Put as put, exectionOfSingleRequest as request, retry, toCamelCase, useRequest, xs };
//# sourceMappingURL=index.js.map
