import { beforeEach, describe, expect, test, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { HttpMethod, makeHttpRequestClient, makeHttpRequestHandler } from './http-client';

vi.mock('axios', async (importActual) => {
  const actual = await importActual<typeof import('axios')>();
  return { ...actual, default: vi.fn() };
});

const mockAxios = vi.mocked(axios);

const makeAxiosError = (status?: number, data?: unknown): AxiosError => {
  const error = new AxiosError('Request failed');
  if (status !== undefined) {
    error.response = { status, data } as never;
  }
  return error;
};

describe('makeHttpRequestHandler', () => {
  beforeEach(() => {
    mockAxios.mockReset();
  });

  test('returns response.data on success', async () => {
    mockAxios.mockResolvedValue({ data: { result: 'ok' } });
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    const result = await handler('https://api.example.com', {});

    expect(result).toEqual({ result: 'ok' });
  });

  test('calls axios with the correct method, url, and params', async () => {
    mockAxios.mockResolvedValue({ data: {} });
    const handler = makeHttpRequestHandler(HttpMethod.POST);

    await handler('https://api.example.com', {
      headers: { 'X-Custom': 'value' },
      data: { body: 'content' },
    });

    expect(mockAxios).toHaveBeenCalledWith({
      method: 'post',
      url: 'https://api.example.com',
      headers: { 'X-Custom': 'value' },
      data: { body: 'content' },
    });
  });

  test('throws UnknownError for non-Axios errors', async () => {
    mockAxios.mockRejectedValue(new Error('generic error'));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.UnknownError }),
    );
  });

  test('throws InvalidInputError for 400 with issues field', async () => {
    mockAxios.mockRejectedValue(makeAxiosError(400, { issues: ['field required'] }));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.InvalidInputError }),
    );
  });

  test('throws GenericBadRequestError for 400 without issues', async () => {
    mockAxios.mockRejectedValue(makeAxiosError(400, { message: 'bad request' }));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.GenericBadRequestError }),
    );
  });

  test('throws GenericUnauthorizedError for 401', async () => {
    mockAxios.mockRejectedValue(makeAxiosError(401));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.GenericUnauthorizedError }),
    );
  });

  test('throws GenericForbiddenError for 403', async () => {
    mockAxios.mockRejectedValue(makeAxiosError(403));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.GenericForbiddenError }),
    );
  });

  test('throws GenericNotFoundError for 404', async () => {
    mockAxios.mockRejectedValue(makeAxiosError(404));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.GenericNotFoundError }),
    );
  });

  test('throws InfrastructureError for other HTTP error statuses', async () => {
    mockAxios.mockRejectedValue(makeAxiosError(503));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.InfrastructureError }),
    );
  });

  test('throws InfrastructureError for AxiosError with no response (network error)', async () => {
    mockAxios.mockRejectedValue(new AxiosError('Network Error'));
    const handler = makeHttpRequestHandler(HttpMethod.GET);

    await expect(handler('https://api.example.com', {})).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.InfrastructureError }),
    );
  });
});

describe('makeHttpRequestClient', () => {
  let capturedShouldRetry: ((e: unknown) => boolean) | undefined;
  const withExponentialRetry = vi.fn((fn: () => Promise<unknown>, shouldRetry?: (e: unknown) => boolean) => {
    capturedShouldRetry = shouldRetry;
    return fn();
  });

  beforeEach(() => {
    capturedShouldRetry = undefined;
    withExponentialRetry.mockClear();
    mockAxios.mockReset();
    mockAxios.mockResolvedValue({ data: {} });
  });

  test('isRetryable returns true for RandomRedditPostNotFoundError', async () => {
    const client = makeHttpRequestClient({ withExponentialRetry });
    await client.get('https://example.com', {});

    expect(capturedShouldRetry!(new BotError(BotErrorType.RandomRedditPostNotFoundError))).toBe(true);
  });

  test('isRetryable returns false for non-retryable BotErrors', async () => {
    const client = makeHttpRequestClient({ withExponentialRetry });
    await client.get('https://example.com', {});

    expect(capturedShouldRetry!(new BotError(BotErrorType.InfrastructureError))).toBe(false);
  });

  test('isRetryable returns false for plain Errors', async () => {
    const client = makeHttpRequestClient({ withExponentialRetry });
    await client.get('https://example.com', {});

    expect(capturedShouldRetry!(new Error('plain'))).toBe(false);
  });

  test('each HTTP method delegates through withExponentialRetry', async () => {
    const client = makeHttpRequestClient({ withExponentialRetry });

    await client.get('https://example.com', {});
    await client.post('https://example.com', {});
    await client.put('https://example.com', {});
    await client.delete('https://example.com', {});
    await client.patch('https://example.com', {});

    expect(withExponentialRetry).toHaveBeenCalledTimes(5);
  });
});
