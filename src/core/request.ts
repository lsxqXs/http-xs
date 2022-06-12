import { transfromRequestPayload, urlQuerySerialize } from "./transform";
import { RequestInterface } from "../typedef";
import { isNil } from "../utils";
import { XsHeaders } from "../headers";
import { transfromResponse } from "./transform";
import { compose } from "./compose";
import dispatchRequest from "../platform/dispatchRequest";
import { ResponseStruct } from "./complete";

export function exectionOfSingleRequest<T = any>(completeOpts: RequestInterface): Promise<ResponseStruct<T>>{
	return compose([ completeOpts.interceptor ].flat(3).filter(Boolean))(completeOpts, async function requestExection(options: RequestInterface) {

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

		// 发送请求
		let responseStruct = await localRequest(options);

		// 处理响应
		return transfromResponse(responseStruct, responseType);
	});
}
