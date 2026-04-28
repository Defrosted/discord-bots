import { HttpRequestClient } from '@lib/adapters/http-client';
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
    const tagsQuery = tags ? `&tags=${encodeURIComponent(tags)}` : '';
    const response = await deps.httpRequestClient.get<unknown>(
      `${deps.cataasApiUrl}/cat?json=true${tagsQuery}`,
      {},
    );

    const cat = makeRecordValidator(cataasApiCatSchema)(response);
    return `${deps.cataasApiUrl}/cat/${cat.id}`;
  },
});
