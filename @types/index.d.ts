import createInstance from "./constructor";
import HttpXsDefaultProto from "./proto";
import { Get, Post, Options, Put, Delete, Patch, Head } from "./core/httpMethod";
import { toCamelCase, XsHeaders } from "./headers";
import { exectionOfSingleRequest } from "./core/request";
import XsCancel from "./cancel";
import { useRequest, define } from "./define";
import { asyncIterable } from "./asyncIterator";
import retry from "./retry";
export * from "./typedef";
export * from "./enums";
declare const xs: {
    create: typeof createInstance;
    asyncIterable: typeof asyncIterable;
    request: typeof exectionOfSingleRequest;
    XsCancel: typeof XsCancel;
    XsHeaders: typeof XsHeaders;
    resolve: {
        (): Promise<void>;
        <T>(value: T): Promise<Awaited<T>>;
        <T_1>(value: T_1 | PromiseLike<T_1>): Promise<Awaited<T_1>>;
    };
    reject: <T_2 = never>(reason?: any) => Promise<T_2>;
    each: typeof import("./utils").forEach;
    retry: typeof retry;
    define: typeof define;
    useRequest: typeof useRequest;
};
export { HttpXsDefaultProto, xs, retry, asyncIterable, createInstance as create, Get, Get as get, Delete, Delete as delete, Post, Post as post, Put, Put as put, Head, Head as head, Patch, Patch as patch, Options, Options as options, exectionOfSingleRequest as request, toCamelCase, XsHeaders, XsCancel, useRequest, define };
export default xs;
