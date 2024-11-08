import type { XsHeaderImpl } from "./typedef";
/**
 * 将`content-type` 转换为 `Content-Type`
 * @param name key
 * @returns key
 */
export declare function toCamelCase(name: string): string;
export type HeaderEntries = Record<string, string> | [string, string][] | XsHeaderImpl;
export declare class XsHeaders implements XsHeaderImpl {
    private readonly urlSearchParams;
    constructor(init?: HeaderEntries);
    static forEach(init: HeaderEntries, each: (key: string, val: string) => void): void;
    static contentType: string;
    static type: {
        json: string;
        text: string;
        form: string;
        formData: string;
    };
    /**
     * 是否是json类型
     * @param src stirng
     * @returns boolean
     */
    static isJSON(src?: string): boolean;
    static isPlainText(src?: string): boolean;
    /**
     * 返回 "Content-Type": "application/json; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static json(init?: HeaderEntries): XsHeaders;
    /**
    * 返回 "Content-Type": "multipart/form-data" 的headers
    * @param init HeaderEntries
    * @returns XsHeaderImpl
    */
    static formData(init?: HeaderEntries): XsHeaders;
    /**
     * 返回  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static form(init?: HeaderEntries): XsHeaders;
    /**
     * 返回 "Content-Type": "text/plain; charset=UTF-8" 的headers
     * @param init HeaderEntries
     * @returns XsHeaderImpl
     */
    static text(init?: HeaderEntries): XsHeaders;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    empty(): boolean;
    toString(): string;
    get [Symbol.toStringTag](): string;
    [Symbol.iterator](): Generator<[string, string], void, unknown>;
    raw(): Record<string, string>;
    get(name: string): string;
    set(name: string, value: string): void;
    append(name: string, value: string): void;
    has(name: string): boolean;
    delete(name: string): void;
    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void;
}
export default XsHeaders;
