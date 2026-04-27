import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mockApiCall = vi.hoisted(() => vi.fn().mockResolvedValue('api-response'));

vi.mock('./http-client', () => ({
  makeHttpRequestHandler: vi.fn(() => mockApiCall),
  HttpMethod: { GET: 'get', POST: 'post', PUT: 'put', DELETE: 'delete', PATCH: 'patch' },
}));

import { makeOauthHttpClient } from './oauth-client';

const makeAuthResponse = (expiresIn = 3600) => ({
  access_token: 'test-token',
  expires_in: expiresIn,
});

const makeHttpRequestClient = () => ({
  get: vi.fn(),
  post: vi.fn().mockResolvedValue(makeAuthResponse()),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
});

const BASE_DEPS = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  authUrl: 'https://www.reddit.com/api/v1/access_token',
};

describe('makeOauthHttpClient', () => {
  beforeEach(() => {
    mockApiCall.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('authenticates on the first request', async () => {
    const httpRequestClient = makeHttpRequestClient();
    const client = makeOauthHttpClient({ ...BASE_DEPS, httpRequestClient });

    await client.get('https://api.example.com', {});

    expect(httpRequestClient.post).toHaveBeenCalledTimes(1);
    expect(httpRequestClient.post).toHaveBeenCalledWith(BASE_DEPS.authUrl, expect.any(Object));
  });

  test('caches the token and does not re-authenticate on the second request', async () => {
    const httpRequestClient = makeHttpRequestClient();
    const client = makeOauthHttpClient({ ...BASE_DEPS, httpRequestClient });

    await client.get('https://api.example.com', {});
    await client.get('https://api.example.com', {});

    expect(httpRequestClient.post).toHaveBeenCalledTimes(1);
  });

  test('re-authenticates when the token has expired', async () => {
    vi.useFakeTimers();
    const httpRequestClient = makeHttpRequestClient();
    httpRequestClient.post.mockResolvedValue(makeAuthResponse(1)); // expires in 1 second
    const client = makeOauthHttpClient({ ...BASE_DEPS, httpRequestClient });

    await client.get('https://api.example.com', {});
    vi.advanceTimersByTime(2000); // advance 2 seconds past expiry
    await client.get('https://api.example.com', {});

    expect(httpRequestClient.post).toHaveBeenCalledTimes(2);
  });

  test('adds Bearer Authorization header to API requests', async () => {
    const httpRequestClient = makeHttpRequestClient();
    httpRequestClient.post.mockResolvedValue({ access_token: 'my-bearer-token', expires_in: 3600 });
    const client = makeOauthHttpClient({ ...BASE_DEPS, httpRequestClient });

    await client.get('https://api.example.com', {});

    const [, params] = mockApiCall.mock.calls[0];
    expect(params.headers.Authorization).toBe('Bearer my-bearer-token');
  });

  test('adds User-Agent header to API requests when configured', async () => {
    const httpRequestClient = makeHttpRequestClient();
    const client = makeOauthHttpClient({
      ...BASE_DEPS,
      httpRequestClient,
      userAgent: 'my-bot/1.0',
    });

    await client.get('https://api.example.com', {});

    const [, params] = mockApiCall.mock.calls[0];
    expect(params.headers['User-Agent']).toBe('my-bot/1.0');
  });

  test('uses Basic auth for the authentication request', async () => {
    const httpRequestClient = makeHttpRequestClient();
    const client = makeOauthHttpClient({ ...BASE_DEPS, httpRequestClient });

    await client.get('https://api.example.com', {});

    const [, params] = httpRequestClient.post.mock.calls[0];
    const expected = Buffer.from(`${BASE_DEPS.clientId}:${BASE_DEPS.clientSecret}`).toString('base64');
    expect(params.headers.Authorization).toBe(`Basic ${expected}`);
  });

  test('adds User-Agent to the authentication request when configured', async () => {
    const httpRequestClient = makeHttpRequestClient();
    const client = makeOauthHttpClient({
      ...BASE_DEPS,
      httpRequestClient,
      userAgent: 'my-bot/1.0',
    });

    await client.get('https://api.example.com', {});

    const [, params] = httpRequestClient.post.mock.calls[0];
    expect(params.headers['User-Agent']).toBe('my-bot/1.0');
  });
});
