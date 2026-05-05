import { HttpRequestClient } from '@lib/adapters/http-client';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { makeRecordValidator } from '@lib/util/record-validator';
import { z } from 'zod';

const cataasApiCatSchema = z.object({ id: z.string() });

interface Deps {
  httpRequestClient: HttpRequestClient;
  cataasApiUrl: string;
}

export interface CatFile {
  id: string;
  bytes: Blob;
}

export interface CataasApiRepository {
  getRandomCatFile: (tags?: string, text?: string) => Promise<CatFile>;
}

export const makeCataasApiRepository = (deps: Deps): CataasApiRepository => ({
  getRandomCatFile: async (tags, text) => {
    const path = tags ? `/cat/${encodeURIComponent(tags)}` : '/cat';
    try {
      const response = await deps.httpRequestClient.get<unknown>(
        `${deps.cataasApiUrl}${path}?json=true`,
        {},
      );
      const { id } = makeRecordValidator(cataasApiCatSchema)(response);
      const textSegment = text ? `/says/${encodeURIComponent(text)}` : '';
      const buffer = await deps.httpRequestClient.get<ArrayBuffer>(
        `${deps.cataasApiUrl}/cat/${id}${textSegment}`,
        { responseType: 'arraybuffer', headers: { Accept: 'image/*' } },
      );
      return { id, bytes: new Blob([buffer]) };
    } catch (error) {
      if (error instanceof BotError && error.errorType === BotErrorType.GenericNotFoundError && tags) {
        throw new BotError(BotErrorType.CatNotFoundForTagError);
      }
      throw error;
    }
  },
});
