import { isNil, isObject, valueOf } from "./utils";
import type { XsHeaderImpl } from "./typedef";


/**
 * 将`content-type` 转换为 `Content-Type`
 * @param name key
 * @returns key
 */
export function toCamelCase(name: string): string {

    if (typeof name !== "string") {
        name = (name as unknown).toString();
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


export type HeaderEntries = Record<string, string> | [string, string][] | XsHeaderImpl;

export class XsHeaders implements XsHeaderImpl {

    private readonly urlSearchParams: URLSearchParams;

    constructor(init?: HeaderEntries) {

        let initialize: Record<string, string> = {};

        XsHeaders.forEach(init, (k, v) => {
            initialize[k] = v;
        });

        this.urlSearchParams = new URLSearchParams(initialize);
    }

    static forEach(init: HeaderEntries, each: (key: string, val: string) => void) {
        if (isNil(init)) {
            return;
        }

        if (valueOf(init) === "Headers" || init instanceof XsHeaders) {
            (init as XsHeaderImpl).forEach((v, k) => each(toCamelCase(k), v));
            return;
        }
        if (isObject(init)) {
            init = Object.entries(init);
        }

        if (typeof init?.forEach === "function") {
            (init as Array<[string, string]>).forEach(([k, v]) => {
                each(toCamelCase(k), v);
            });
        }
    }

    static contentType = "Content-Type";
    static type = {
        json: "application/json; charset=UTF-8",
        text: "text/plain; charset=UTF-8",
        form: "application/x-www-form-urlencoded; charset=UTF-8",
        formData: "multipart/form-data"
    };

    /**
     * 是否是json类型
     * @param src stirng
     * @returns boolean
     */
    static isJSON(src?: string) {
        return src?.includes("application/json");
    }
    static isPlainText(src?: string) {
        return src?.includes("text/plain");
    }

    /**
     * 返回 "Content-Type": "application/json; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static json(init?: HeaderEntries) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.json);
        return nextHeader;
    }

    /**
    * 返回 "Content-Type": "multipart/form-data" 的headers
    * @param init HeaderEntries
    * @returns XsHeaderImpl
    */
    static formData(init?: HeaderEntries) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.formData);
        return nextHeader;
    }

    /**
     * 返回  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static form(init?: HeaderEntries) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.form);
        return nextHeader;
    }

    /**
     * 返回 "Content-Type": "text/plain; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static text(init?: HeaderEntries) {
        let nextHeader = new XsHeaders(init);
        nextHeader.append(XsHeaders.contentType, XsHeaders.type.text);
        return nextHeader;
    }


    *keys(): IterableIterator<string> {
        let ks = this.urlSearchParams.keys();
        for (let k of ks) {
            yield k;
        }
    }

    *values(): IterableIterator<string> {
        let ks = this.urlSearchParams.values();
        for (let k of ks) {
            yield k;
        }
    }

    empty(): boolean {
        return Array.from(this.keys()).length === 0;
    }

    toString(): string {
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

    raw(): Record<string, string> {
        let ans = {};
        this.urlSearchParams.forEach(function each(val, key) {
            ans[key] = val;
        });
        return ans;
    }

    get(name: string) {
        let ans = this.urlSearchParams.get(toCamelCase(name));
        return ans ?? null;
    }

    set(name: string, value: string) {
        return this.urlSearchParams.set(toCamelCase(name), value);
    }

    append(name: string, value: string) {
        return this.urlSearchParams.append(toCamelCase(name), value);
    }

    has(name: string) {
        return this.urlSearchParams.has(toCamelCase(name));
    }

    delete(name: string) {
        return this.urlSearchParams.delete(toCamelCase(name));
    }

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void {
        return this.urlSearchParams.forEach(callbackfn, thisArg);
    }
}

export default XsHeaders;
