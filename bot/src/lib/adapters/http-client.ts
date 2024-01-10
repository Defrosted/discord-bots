import { WithExponentialRetry } from '@lib/util/with-exponential-retry';
import axios, { AxiosError } from 'axios';
import { BotError, BotErrorType } from '../errors/bot-error';

export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
}
type BodylessHttpMethods = HttpMethod.GET;

interface RequestParamsBase {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

export type HttpRequestParams<Method extends HttpMethod> =
  Method extends BodylessHttpMethods
    ? RequestParamsBase
    : RequestParamsBase & { data?: unknown };

export const makeHttpRequestHandler =
  <Method extends HttpMethod>(method: Method) =>
  async <T = unknown>(
    url: string,
    params: HttpRequestParams<Method>,
  ): Promise<T> => {
    try {
      const result = await axios({
        method,
        url,
        ...params,
      });

      return result.data as T;
    } catch (error) {
      if (!(error instanceof AxiosError))
        throw new BotError(BotErrorType.UnknownError, { logDetails: error });

      switch (error.response?.status) {
        case 400:
          if (error.response.data?.issues)
            throw new BotError(BotErrorType.InvalidInputError, {
              logDetails: error.response.data.issues,
            });

          throw new BotError(BotErrorType.GenericBadRequestError, {
            logDetails: error.response.data,
          });
        case 401:
          throw new BotError(BotErrorType.GenericForbiddenError, {
            logDetails: error.response.data,
          });
        case 403:
          throw new BotError(BotErrorType.GenericUnauthorizedError, {
            logDetails: error.response.data,
          });
        case 404:
          throw new BotError(BotErrorType.GenericNotFoundError, {
            logDetails: error.response.data,
          });
        default:
          throw new BotError(BotErrorType.InfrastructureError, {
            logDetails: error,
          });
      }
    }
  };

export interface HttpRequestClient {
  get: <T>(
    url: string,
    params: HttpRequestParams<HttpMethod.GET>,
  ) => Promise<T>;
  post: <T>(
    url: string,
    params: HttpRequestParams<HttpMethod.POST>,
  ) => Promise<T>;
  put: <T>(
    url: string,
    params: HttpRequestParams<HttpMethod.PUT>,
  ) => Promise<T>;
  delete: <T>(
    url: string,
    params: HttpRequestParams<HttpMethod.DELETE>,
  ) => Promise<T>;
  patch: <T>(
    url: string,
    params: HttpRequestParams<HttpMethod.PATCH>,
  ) => Promise<T>;
}

interface Deps {
  withExponentialRetry: WithExponentialRetry;
}

const isRetryable = (error: unknown) => {
  if (!(error instanceof BotError)) return false;

  return error.isRetryable;
};

const makeHttpRequestHandlerWithRetries =
  (deps: Deps) =>
  <Method extends HttpMethod>(method: Method) =>
  <T = unknown>(
    ...args: Parameters<ReturnType<typeof makeHttpRequestHandler<Method>>>
  ): Promise<T> =>
    deps.withExponentialRetry(
      () => makeHttpRequestHandler(method)(...args),
      isRetryable,
    );

export const makeHttpRequestClient = (deps: Deps): HttpRequestClient => {
  const makeHttpRequestHandler = makeHttpRequestHandlerWithRetries(deps);

  return {
    get: makeHttpRequestHandler(HttpMethod.GET),
    post: makeHttpRequestHandler(HttpMethod.POST),
    put: makeHttpRequestHandler(HttpMethod.PUT),
    delete: makeHttpRequestHandler(HttpMethod.DELETE),
    patch: makeHttpRequestHandler(HttpMethod.PATCH),
  };
};
