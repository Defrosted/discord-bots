import * as log from 'lambda-log';

const timeoutMs = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface Deps {
  timeoutFn?: (ms: number) => Promise<unknown>;
  maxRetries?: number;
  retryExponent?: number;
}

export type WithExponentialRetry = <T>(
  fn: () => Promise<T>,
  shouldRetry?: (error: unknown) => boolean,
  retryDelay?: number,
) => Promise<T>;

export const makeWithExponentialRetry = ({
  timeoutFn = timeoutMs,
  maxRetries = 2,
  retryExponent = 2,
}: Deps): WithExponentialRetry => {
  const withExponentialRetry = async <T>(
    fn: () => Promise<T>,
    shouldRetry?: (error: unknown) => boolean,
    retryDelay = 500,
    retryCount = 0,
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      log.debug(
        `Retry handler errored, attempt ${retryCount + 1} of ${maxRetries + 1}`,
      );

      if (retryCount >= maxRetries) throw error;

      if (shouldRetry && !shouldRetry(error)) throw error;

      await timeoutFn(retryDelay);
      return withExponentialRetry<T>(
        fn,
        shouldRetry,
        retryDelay * retryExponent,
        retryCount + 1,
      );
    }
  };

  return withExponentialRetry;
};
