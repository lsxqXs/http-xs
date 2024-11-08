import { isNodePlatform, isEmpty, valueOf } from "../utils";
import type { RequestInterface, XsHeaderImpl } from "../typedef";
import { XsHeaders } from "../headers";
import { forEach, isAbsoluteURL, isObject, isNil } from "../utils";
import { ResponseStruct } from "./complete";


export function encode(input: string): string {
    try {
        return encodeURIComponent(input)
            .replace(/%3A/gi, ":")
            .replace(/%24/g, "$")
            .replace(/%2C/gi, ",")
            .replace(/%22/gi, "")
            .replace(/%20/g, "+")
            .replace(/%5B/gi, "[")
            .replace(/%5D/gi, "]");
    } catch (e) {
        console.error(input.toString() + e);
        return input.toString();
    }
}


const querySerializerMap = {
    "String": query => query.replace(/^\?*/, "").replace(/&[\w\W]=$/, ""),
    "URLSearchParams": query => query.toString(),
    "Object": query => {
        let queryList = [];

        function buildObject(obj: unknown, ks: string) {

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

            queryList.push(`${encode(ks as string)}=${encode(obj as string)}`);
        }


        function each(key: string, val: unknown) {
            if (val === null || val === "undfefined") {
                return;
            }

            let valType = valueOf(val);

            switch (valType) {
                case "Date":
                    val = (val as Date).toISOString();
                    break;
                case "URLSearchParams":
                    for (let [k, v] of (val as URLSearchParams).entries()) {
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
                        val = val?.toString();
                    }
                    break;
            }

            queryList.push(`${encode(key as string)}=${encode(val as string)}`);
        }

        forEach(query, each);

        return queryList.length > 0 ? `?${queryList.join("&")}` : "";
    }
};

export function urlQuerySerialize(originalUrl = "", opts: RequestInterface) {

    let sourceQuery: RequestInterface["query"] = opts.query;

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

export function transfromRequestPayload(opts: RequestInterface) {
    let body = opts.body;

    /* eslint-disable eqeqeq */
    if (body == null) {
        return null;
    }

    let header = opts.headers as XsHeaderImpl;
    let headerContentType = header.get(XsHeaders.contentType), replaceContentType = headerContentType;

    switch (valueOf(body).toLowerCase()) {
        case "array":
        case "urlsearchparams":
        case "object": {
            if (
                XsHeaders.isJSON(replaceContentType) &&
                (isObject(body) || Array.isArray(body))
            ) {
                body = JSON.stringify(body);
            }
            else {
                body = new URLSearchParams(body as URLSearchParams | Record<string, string>).toString();
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
                body = Buffer.from(new Uint8Array(body as ArrayBuffer));
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

export function transfromResponse(responseStruct: ResponseStruct, responseType: string) {
    let response = responseStruct.response ?? "";

    switch (responseType?.toLowerCase()) {
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
            } catch (error) {
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
