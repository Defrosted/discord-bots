import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { makeRecordValidator } from './record-validator';
import { BotError, BotErrorType } from '@lib/errors/bot-error';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

describe('makeRecordValidator', () => {
  test('returns validated data on success', () => {
    const validate = makeRecordValidator(schema);
    expect(validate({ name: 'Alice', age: 30 })).toEqual({ name: 'Alice', age: 30 });
  });

  test('throws BotError with InvalidInputError by default on validation failure', () => {
    const validate = makeRecordValidator(schema);
    expect(() => validate({ name: 'Alice' })).toThrow(BotError);
    expect(() => validate({ name: 'Alice' })).toThrow(
      expect.objectContaining({ errorType: BotErrorType.InvalidInputError }),
    );
  });

  test('throws BotError with custom errorType when specified', () => {
    const validate = makeRecordValidator(schema, BotErrorType.InvalidSignatureError);
    expect(() => validate({ name: 'Alice' })).toThrow(
      expect.objectContaining({ errorType: BotErrorType.InvalidSignatureError }),
    );
  });

  test('attaches Zod error to logDetails on failure', () => {
    const validate = makeRecordValidator(schema);
    let thrownError: BotError | undefined;
    try {
      validate({ name: 123 });
    } catch (e) {
      thrownError = e as BotError;
    }
    expect(thrownError?.logDetails).toBeDefined();
  });

  test('throws on completely invalid input', () => {
    const validate = makeRecordValidator(schema);
    expect(() => validate(null)).toThrow(BotError);
    expect(() => validate(undefined)).toThrow(BotError);
    expect(() => validate('string')).toThrow(BotError);
  });
});
