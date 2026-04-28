import { describe, expect, test, vi } from 'vitest';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { makeCataasApiRepository } from './cataas-api';

const CATAAS_API_URL = 'https://cataas.com';

const makeHttpRequestClient = () => ({
  get: vi.fn().mockResolvedValue({ id: 'abc123' }),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
});

describe('makeCataasApiRepository', () => {
  describe('getRandomCatPhotoUrl', () => {
    test('calls /cat?json=true when no tags provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await repo.getRandomCatPhotoUrl();

      expect(httpRequestClient.get).toHaveBeenCalledWith(
        `${CATAAS_API_URL}/cat?json=true`,
        expect.any(Object),
      );
    });

    test('uses tags as a path segment when tags provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await repo.getRandomCatPhotoUrl('cute,funny');

      expect(httpRequestClient.get).toHaveBeenCalledWith(
        `${CATAAS_API_URL}/cat/cute%2Cfunny?json=true`,
        expect.any(Object),
      );
    });

    test('throws CatNotFoundForTagError when the API returns 404 and tags were provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      httpRequestClient.get.mockRejectedValue(new BotError(BotErrorType.GenericNotFoundError));
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await expect(repo.getRandomCatPhotoUrl('nonexistent')).rejects.toMatchObject({
        errorType: BotErrorType.CatNotFoundForTagError,
      });
    });

    test('rethrows GenericNotFoundError as-is when no tags provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      httpRequestClient.get.mockRejectedValue(new BotError(BotErrorType.GenericNotFoundError));
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await expect(repo.getRandomCatPhotoUrl()).rejects.toMatchObject({
        errorType: BotErrorType.GenericNotFoundError,
      });
    });

    test('returns /cat/{id} URL for the cat returned by the API', async () => {
      const httpRequestClient = makeHttpRequestClient();
      httpRequestClient.get.mockResolvedValue({ id: 'deadbeef' });
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      const result = await repo.getRandomCatPhotoUrl();

      expect(result).toBe(`${CATAAS_API_URL}/cat/deadbeef`);
    });
  });
});
