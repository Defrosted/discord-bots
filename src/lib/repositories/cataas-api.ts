import { HttpRequestClient } from '@lib/adapters/http-client';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { makeRecordValidator } from '@lib/util/record-validator';
import { z } from 'zod';

const cataasApiCatSchema = z.object({ id: z.string() });

interface Deps {
  httpRequestClient: HttpRequestClient;
  cataasApiUrl: string;
}

export interface CataasApiRepository {
  getRandomCatPhotoUrl: (tags?: string) => Promise<string>;
}

export const makeCataasApiRepository = (deps: Deps): CataasApiRepository => ({
  getRandomCatPhotoUrl: async (tags) => {
    const path = tags ? `/cat/${encodeURIComponent(tags)}` : '/cat';
    try {
      const response = await deps.httpRequestClient.get<unknown>(
        `${deps.cataasApiUrl}${path}?json=true`,
        {},
      );
      const cat = makeRecordValidator(cataasApiCatSchema)(response);
      return `${deps.cataasApiUrl}/cat/${cat.id}`;
    } catch (error) {
      if (error instanceof BotError && error.errorType === BotErrorType.GenericNotFoundError && tags) {
        throw new BotError(BotErrorType.CatNotFoundForTagError);
      }
      throw error;
    }
  },
});
