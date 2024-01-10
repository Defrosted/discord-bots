import { DateTime } from 'luxon';
import {
  HttpMethod,
  HttpRequestClient,
  HttpRequestParams,
  makeHttpRequestHandler,
} from './http-client';

interface Deps {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  userAgent?: string;
  httpRequestClient: HttpRequestClient;
}

interface AuthResponse {
  access_token: string;
  expires_in: number;
}

export type OAuthClient = HttpRequestClient;

export const makeOauthHttpClient = (deps: Deps): OAuthClient => {
  let token: string | undefined = undefined;
  let tokenExpiration: DateTime | undefined = undefined;

  const isTokenValid = () =>
    !!token &&
    !!tokenExpiration &&
    tokenExpiration.toMillis() > DateTime.now().toMillis();

  const authenticate = async (): Promise<string> => {
    if (isTokenValid()) return token as string;

    const authString = `${deps.clientId}:${deps.clientSecret}`;

    const headers: Record<string, string> = {
      Authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
    };
    if (deps.userAgent) headers['User-Agent'] = deps.userAgent;

    const authResponse = await deps.httpRequestClient.post<AuthResponse>(
      deps.authUrl,
      {
        headers,
        data: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      },
    );

    token = authResponse.access_token;
    tokenExpiration = DateTime.now().plus({ seconds: authResponse.expires_in });

    return token;
  };

  const wrapHttpRequestHandler =
    <Method extends HttpMethod>(method: Method) =>
    async <T = unknown>(
      url: string,
      params: HttpRequestParams<Method>,
    ): Promise<T> => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${await authenticate()}`,
      };

      if (deps.userAgent) headers['User-Agent'] = deps.userAgent;

      return makeHttpRequestHandler(method)(url, {
        ...params,
        headers: {
          ...params.headers,
          ...headers,
        },
      });
    };

  return {
    get: wrapHttpRequestHandler(HttpMethod.GET),
    post: wrapHttpRequestHandler(HttpMethod.POST),
    put: wrapHttpRequestHandler(HttpMethod.PUT),
    delete: wrapHttpRequestHandler(HttpMethod.DELETE),
    patch: wrapHttpRequestHandler(HttpMethod.PATCH),
  };
};
