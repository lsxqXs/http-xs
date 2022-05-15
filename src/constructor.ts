import mergeConfig from "./core/merge";
import { UseMidwareCallback, Method, RequestInterface, XsHeaderImpl, HttpMethod, CustomRequest } from "./typedef";
import { isObject } from "./utils";
import { RecordInterface } from "./parts/define";
import HttpXsDefaultProto from "./proto";

const methodNamed = [ "get", "post", "delete", "put", "patch", "options", "head" ] as Method[];

interface DefaultConfig {

  /**
   * 实例拦截器
   */
  interceptor?: UseMidwareCallback[];

  /**
   * 共享headers
   */
  headers?: RequestInterface["headers"];

  /**
   * 超时时间
   */
  timeout?: number;

  /**
   * 共享url
   */
  baseUrl?: string;

  /**
   * 实例响应类型
   */
  responseType?: RequestInterface["responseType"];

  /**
   * fetch｜xhr
   */
  requestMode?: RequestInterface["requestMode"];

  /**
   * 自定义请求执行函数
   */
  customRequest?: CustomRequest;
}

function mergeDefaultInceConfig(defaultConfig: DefaultConfig, customReq: RequestInterface) {

  let { headers, baseUrl = "" } = defaultConfig;

  // header
  customReq.headers = new HttpXsDefaultProto.XsHeaders(customReq.headers);

  (headers as XsHeaderImpl).forEach(function each(val, key) {
    (customReq.headers as XsHeaderImpl).set(key, val);
  });

  // url
  customReq.url = baseUrl + customReq.url.replace(/^\/*/, "/");

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
  })) as UseMidwareCallback;

  // use
  if (Array.isArray(defaultConfig.interceptor)) {
    customReq.interceptor = defaultConfig.interceptor.concat(del, existsInterceptor).filter(Boolean);
  }

  if (typeof defaultConfig.responseType === "string" && typeof customReq.responseType !== "string") {
    customReq.responseType = defaultConfig.responseType;
  }

  if (typeof defaultConfig.requestMode === "string" && typeof defaultConfig.requestMode !== "string") {
    customReq.requestMode = defaultConfig.requestMode;
  }

  if (typeof defaultConfig.customRequest === "function" && typeof customReq.customRequest !== "function") {
    customReq.customRequest = defaultConfig.customRequest;
  }

  return customReq;
}

function resolveDefaultConfig(defaultConfig?: DefaultConfig) {

  if (!isObject(defaultConfig)) {
    defaultConfig = {};
  }

  defaultConfig.headers = new HttpXsDefaultProto.XsHeaders(defaultConfig.headers);

  !(defaultConfig.headers.has(HttpXsDefaultProto.contentType.contentType)) && defaultConfig.headers.set(HttpXsDefaultProto.contentType.contentType, HttpXsDefaultProto.contentType.search);

  if (typeof defaultConfig.baseUrl === "string") {
    defaultConfig.baseUrl = defaultConfig.baseUrl.replace(/[?/]*$/, "");
  }

  return defaultConfig;
}

interface UseFunction<
  T,
  F extends (...arg: Parameters<UseMidwareCallback>) => ReturnType<UseMidwareCallback> = (...arg: Parameters<UseMidwareCallback>) => ReturnType<UseMidwareCallback>
  > {
  (fn: F): T;
  (fns: F[]): T;
  (...fns: F[]): T;
  delete(fn: F): boolean;
}

type Instance = typeof HttpXsDefaultProto & { [key in Method]: HttpMethod } & { use: UseFunction<Instance> };

function createInstance(defaultInstaceConfig?: DefaultConfig): Instance {

  const fullInstceConf = resolveDefaultConfig(defaultInstaceConfig);
  const instce = Object.create(null);

  instce.defaultConfig = fullInstceConf;

  instce.use = function use(...fns: UseMidwareCallback[]) {
    let uses = instce.defaultConfig.interceptor;

    if (!Array.isArray(uses)) {
      uses = instce.defaultConfig.interceptor = [];
    }

    uses.push(...fns.flat(10));
    return this;
  };

  instce.use.delete = function deleteUseFunction(fn: UseMidwareCallback) {
    let used = instce.defaultConfig.interceptor;
    if (!Array.isArray(used)) {
      return false;
    }
    let deletion = used.splice(used.findIndex(fn), 1);
    return deletion.length !== 0;
  };

  methodNamed.forEach(function each(method) {
    instce[method] = function HttpMethod(this: { defaultConfig: DefaultConfig }, url, opts) {
      // ! 会覆盖
      // ? merge baseConfig
      let finish = mergeDefaultInceConfig(this.defaultConfig, mergeConfig(url, opts));
      finish.method = method;
      return instce.request(finish);
    };
  });

  instce.defineInterface = function (apiDefine: RecordInterface) {
    return HttpXsDefaultProto.defineInterface(instce, apiDefine);
  };

  instce.setProfix = function (nextUrl: string, replace = false) {
    if (replace) {
      this.defaultConfig.baseUrl = nextUrl;
      return;
    }

    fullInstceConf.baseUrl += nextUrl.replace(/^\/*/, "/");
  };


  Object.setPrototypeOf(instce, HttpXsDefaultProto);

  return instce;
}


export { createInstance };
export default createInstance;