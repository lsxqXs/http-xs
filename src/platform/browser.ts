import { RequestInterface, XsHeaderImpl } from "../typedef";
import { XsError, validateFetchStatus, ResponseStruct } from "../core/complete";
import { asyncReject, asyncResolve } from "../utils";
import XsHeaders from "../headers";
import XsCancel from "../cancel";

const each = (init, line) => {
  let [ key, val ] = line.split(":");
  init[key] = val.trim();
  return init;
};

function parserRawHeader(xhr: XMLHttpRequest) {
  let head;
  let h = (xhr.getAllResponseHeaders() ?? "").trim();

  if (h.length > 0) {
    head = h.split(/\r\n/).reduce(each, {});
  }

  return new XsHeaders(head);
}


export function xhrRequest<T = any>(opts: RequestInterface): Promise<ResponseStruct<T>> {

  let xhr = new globalThis.XMLHttpRequest();

  if (typeof opts.responseType === "string") {
    xhr.responseType = opts.responseType.toLocaleLowerCase() as XMLHttpRequestResponseType;
  }

  xhr.open(opts.method, opts.url, true, opts?.auth?.username, opts?.auth?.password);

  (opts.headers as XsHeaderImpl).forEach(function each(val, key) { xhr.setRequestHeader(key, val) });

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
      if (opts.cancel.signal.aborted) { return }
      xhr.abort();
      abort = null;
    };

    opts.cancel.signal.addEventListener("abort", abort, { once: true });
  }

  return new Promise(function executor(resolve, reject) {
    xhr.onabort = function onAbort() {
      reject(new XsError(xhr.status, "Http-xs: Client Aborted", opts, parserRawHeader(xhr), "abort"));
      xhr = null;
    };

    xhr.ontimeout = function onTimeout() {
      reject(new XsError(xhr.status, `Http-xs: Network Timeout of ${xhr.timeout}ms`, opts, parserRawHeader(xhr), "timeout"));
      xhr = null;
    };

    xhr.onerror = function onError() {
      reject(new XsError(xhr.status, "Http-xs: Network Error", opts, parserRawHeader(xhr), "error"));
      xhr = null;
    };

    xhr.onreadystatechange = function onreadystatechange() {
      if (xhr === null || this.readyState !== 4) {
        return;
      }
      if (this.responseURL.startsWith("file:") || this.status === 0) {
        return;
      }

      new ResponseStruct<T>(
        validateFetchStatus(this.status, resolve, reject),
        this.response,
        this.status,
        this.statusText,
        opts,
        null,
        parserRawHeader(this)
      );

      xhr = null;
    };

    xhr.send(opts.body as Document | Blob | BufferSource | FormData | URLSearchParams | string);
  });
}


export async function fetchRequest<T = any>(opts: RequestInterface): Promise<ResponseStruct<T>> {

  let url = opts.url;

  let cancelController: AbortController = opts.signal;

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
      cancelController = opts.cancel as AbortController;
    }
  }

  let header = opts.headers as any;

  if (header instanceof XsHeaders) {
    header = header.raw();
  }

  let req = new globalThis.Request(url, {
    cache: opts.cache,
    credentials: opts.credentials,
    integrity: opts.integrity,
    keepalive: opts.keepalive,
    body: opts.body as BodyInit,
    method: opts.method,
    mode: opts.mode,
    headers: header,
    redirect: opts.redirect,
    referrer: opts.referrer,
    referrerPolicy: opts.referrerPolicy,
    signal: cancelController?.signal
  });

  let readBody;

  try {
    readBody = await globalThis.fetch(req);

    let body = readBody.clone();
    let response = await readBody[opts.responseType]().catch(() => body.text());
    let xsHeader = new XsHeaders();

    body.headers.forEach((val, key) => xsHeader.set(key, val));

    return new ResponseStruct<T>(
      validateFetchStatus(body.status, asyncResolve, asyncReject),
      response,
      body.status,
      body.statusText,
      opts,
      body.type,
      xsHeader
    );

  } catch (exx) {
    let header = new XsHeaders();

    // fetch 取消请求时的错误对象 —> DOMException
    if (exx instanceof DOMException) {
      return asyncReject(new XsError(0, `Http-xs: Client Abort ${exx.toString()}`, opts, header, "abort"));
    }
    return asyncReject(new XsError(0, `Http-xs: ${(exx as Error).message}`, opts, header, "error"));
  }
}
