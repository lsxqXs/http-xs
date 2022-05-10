import { exectionOfSingleRequest } from "./core/request";
import mergeConfig from "./core/merge";
import { UseMidware, Method, RequestInterface, XsHeaderImpl, HttpMethod, CustomRequest } from "./typedef";
import { isObject } from "./utils";
import { RecordInterface } from "./parts/define";
import HttpXsDefaultProto from "./proto";

const methodNamed = [ "get", "post", "delete", "put", "patch", "options", "head" ] as Method[];

interface DefaultConfig {

  /**
   * 实例拦截器
   */
  interceptor?: UseMidware[];

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

function pushMidHandler(...args: UseMidware[]);
function pushMidHandler(mids: UseMidware[]);
function pushMidHandler(fn: UseMidware);
function pushMidHandler(this: { defaultConfig: DefaultConfig }, ...args) {
  // 可能是10
  this.defaultConfig.interceptor.push(...args.flat(10));
  return this;
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

  // use
  customReq.interceptor = defaultConfig.interceptor.concat(customReq.interceptor).filter(Boolean);

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

  defaultConfig.interceptor ??= [];

  defaultConfig.headers = new HttpXsDefaultProto.XsHeaders(defaultConfig.headers);

  !(defaultConfig.headers.has(HttpXsDefaultProto.contentType.contentType)) && defaultConfig.headers.set(HttpXsDefaultProto.contentType.contentType, HttpXsDefaultProto.contentType.search);

  if (typeof defaultConfig.baseUrl === "string") {
    defaultConfig.baseUrl = defaultConfig.baseUrl.replace(/[?/]*$/, "");
  }

  return defaultConfig;
}

interface UseFunction<T> {
  (fn: UseMidware): T;
  (fns: UseMidware[]): T;
  (...fns: UseMidware[]): T;
}
type Instance = typeof HttpXsDefaultProto & { [key in Method]: HttpMethod } & { use: UseFunction<Instance> };

function createInstance(defaultInstaceConfig?: DefaultConfig): Instance {

  const fullInstceConf = resolveDefaultConfig(defaultInstaceConfig);
  const instce = Object.create(null);

  instce.defaultConfig = fullInstceConf;

  instce.use = function use(fn: UseMidware) {
    return pushMidHandler.call(this, fn);
  };

  methodNamed.forEach(function each(method) {
    instce[method] = function HttpMethod(this: { defaultConfig: DefaultConfig }, url, opts) {
      // ! 会覆盖
      // ? merge baseConfig
      let finish = mergeDefaultInceConfig(this.defaultConfig, mergeConfig(url, opts));
      finish.method = method;
      return exectionOfSingleRequest(finish);
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