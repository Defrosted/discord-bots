import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { z } from 'zod';

export const makeRecordValidator =
  <T>(
    schema: z.Schema<T> | z.ZodEffects<z.Schema<T>>,
    errorType = BotErrorType.InvalidInputError,
  ) =>
  (data: Partial<z.infer<z.Schema<T>>> | unknown) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new BotError(errorType, { logDetails: result.error });
    }

    return result.data;
  };
