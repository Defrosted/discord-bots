import { describe, expect, test, vi } from 'vitest';
import { makeWithExponentialRetry } from './with-exponential-retry';

const makeTimeoutFn = () => vi.fn().mockResolvedValue(undefined);

describe('makeWithExponentialRetry', () => {
  test('returns result immediately when fn succeeds on first attempt', async () => {
    const timeoutFn = makeTimeoutFn();
    const retry = makeWithExponentialRetry({ timeoutFn });
    const fn = vi.fn().mockResolvedValue('success');

    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(timeoutFn).not.toHaveBeenCalled();
  });

  test('retries on failure and returns result when eventually successful', async () => {
    const timeoutFn = makeTimeoutFn();
    const retry = makeWithExponentialRetry({ timeoutFn, maxRetries: 2 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(timeoutFn).toHaveBeenCalledTimes(1);
  });

  test('throws after exhausting maxRetries', async () => {
    const timeoutFn = makeTimeoutFn();
    const error = new Error('persistent failure');
    const retry = makeWithExponentialRetry({ timeoutFn, maxRetries: 2 });
    const fn = vi.fn().mockRejectedValue(error);

    await expect(retry(fn)).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  test('does not retry when shouldRetry returns false', async () => {
    const timeoutFn = makeTimeoutFn();
    const retry = makeWithExponentialRetry({ timeoutFn, maxRetries: 2 });
    const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
    const shouldRetry = vi.fn().mockReturnValue(false);

    await expect(retry(fn, shouldRetry)).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(timeoutFn).not.toHaveBeenCalled();
  });

  test('retries when shouldRetry returns true', async () => {
    const timeoutFn = makeTimeoutFn();
    const retry = makeWithExponentialRetry({ timeoutFn, maxRetries: 1 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('retryable'))
      .mockResolvedValue('ok');
    const shouldRetry = vi.fn().mockReturnValue(true);

    const result = await retry(fn, shouldRetry);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('uses exponential backoff delays', async () => {
    const delays: number[] = [];
    const timeoutFn = vi.fn((ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    });
    const retry = makeWithExponentialRetry({ timeoutFn, maxRetries: 3, retryExponent: 2 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(retry(fn, undefined, 500)).rejects.toThrow();
    expect(delays).toEqual([500, 1000, 2000]);
  });

  test('defaults to 500ms initial delay and 2x exponent', async () => {
    const delays: number[] = [];
    const timeoutFn = vi.fn((ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    });
    const retry = makeWithExponentialRetry({ timeoutFn, maxRetries: 2 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(retry(fn)).rejects.toThrow();
    expect(delays).toEqual([500, 1000]);
  });
});
