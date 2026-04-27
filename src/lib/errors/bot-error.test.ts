import { describe, expect, test } from 'vitest';
import { BotError, BotErrorCode, BotErrorType } from './bot-error';

describe('BotError', () => {
  describe('constructor', () => {
    test('is an instance of Error', () => {
      expect(new BotError(BotErrorType.InvalidInputError)).toBeInstanceOf(Error);
    });

    test('sets message from error parameters', () => {
      expect(new BotError(BotErrorType.InvalidInputError).message).toBe('Invalid input');
      expect(new BotError(BotErrorType.InvalidSignatureError).message).toBe('Invalid signature');
      expect(new BotError(BotErrorType.CommandNotFoundError).message).toBe('Unsupported command');
    });

    test('sets errorType', () => {
      const error = new BotError(BotErrorType.InvalidInputError);
      expect(error.errorType).toBe(BotErrorType.InvalidInputError);
    });

    test('sets errorCode', () => {
      const error = new BotError(BotErrorType.InvalidInputError);
      expect(error.errorCode).toBe(BotErrorCode.BadRequestError);
    });

    test('stores logDetails', () => {
      const logDetails = { field: 'missing' };
      const error = new BotError(BotErrorType.InvalidInputError, { logDetails });
      expect(error.logDetails).toEqual(logDetails);
    });

    test('stores responseDetails', () => {
      const responseDetails = { message: 'bad request' };
      const error = new BotError(BotErrorType.InvalidInputError, { responseDetails });
      expect(error.responseDetails).toEqual(responseDetails);
    });

    test('logDetails and responseDetails are undefined when not provided', () => {
      const error = new BotError(BotErrorType.InvalidInputError);
      expect(error.logDetails).toBeUndefined();
      expect(error.responseDetails).toBeUndefined();
    });
  });

  describe('isRetryable', () => {
    test('is false by default', () => {
      expect(new BotError(BotErrorType.InvalidInputError).isRetryable).toBe(false);
      expect(new BotError(BotErrorType.InfrastructureError).isRetryable).toBe(false);
    });

    test('is true for RandomRedditPostNotFoundError', () => {
      expect(new BotError(BotErrorType.RandomRedditPostNotFoundError).isRetryable).toBe(true);
    });
  });

  describe('getStatusCode', () => {
    test('returns 400 for bad request error types', () => {
      expect(new BotError(BotErrorType.InvalidInputError).getStatusCode()).toBe(400);
      expect(new BotError(BotErrorType.InvalidConfigError).getStatusCode()).toBe(400);
      expect(new BotError(BotErrorType.GenericBadRequestError).getStatusCode()).toBe(400);
    });

    test('returns 401 for unauthorized error types', () => {
      expect(new BotError(BotErrorType.InvalidSignatureError).getStatusCode()).toBe(401);
      expect(new BotError(BotErrorType.GenericUnauthorizedError).getStatusCode()).toBe(401);
    });

    test('returns 403 for forbidden error types', () => {
      expect(new BotError(BotErrorType.GenericForbiddenError).getStatusCode()).toBe(403);
    });

    test('returns 404 for not found error types', () => {
      expect(new BotError(BotErrorType.GenericNotFoundError).getStatusCode()).toBe(404);
      expect(new BotError(BotErrorType.CommandNotFoundError).getStatusCode()).toBe(404);
      expect(new BotError(BotErrorType.RandomRedditPostNotFoundError).getStatusCode()).toBe(404);
    });

    test('returns 500 for infrastructure error types', () => {
      expect(new BotError(BotErrorType.InfrastructureError).getStatusCode()).toBe(500);
    });
  });
});
