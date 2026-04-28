import { describe, expect, test, vi } from 'vitest';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { makeCataasApiRepository } from './cataas-api';

const CATAAS_API_URL = 'https://cataas.com';
const CAT_BUFFER = new ArrayBuffer(8);

const makeHttpRequestClient = () => ({
  get: vi.fn()
    .mockResolvedValueOnce({ id: 'abc123' })
    .mockResolvedValueOnce(CAT_BUFFER),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
});

describe('makeCataasApiRepository', () => {
  describe('getRandomCatFile', () => {
    test('calls /cat?json=true when no tags provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await repo.getRandomCatFile();

      expect(httpRequestClient.get).toHaveBeenCalledWith(
        `${CATAAS_API_URL}/cat?json=true`,
        expect.any(Object),
      );
    });

    test('uses tags as a path segment when tags provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await repo.getRandomCatFile('cute,funny');

      expect(httpRequestClient.get).toHaveBeenCalledWith(
        `${CATAAS_API_URL}/cat/cute%2Cfunny?json=true`,
        expect.any(Object),
      );
    });

    test('fetches the cat binary using the ID with Accept: image/* header', async () => {
      const httpRequestClient = makeHttpRequestClient();
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await repo.getRandomCatFile();

      expect(httpRequestClient.get).toHaveBeenCalledWith(
        `${CATAAS_API_URL}/cat/abc123`,
        expect.objectContaining({ responseType: 'arraybuffer', headers: { Accept: 'image/*' } }),
      );
    });

    test('returns the cat id and a Blob wrapping the fetched binary', async () => {
      const httpRequestClient = makeHttpRequestClient();
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      const result = await repo.getRandomCatFile();

      expect(result.id).toBe('abc123');
      expect(result.bytes).toBeInstanceOf(Blob);
    });

    test('throws CatNotFoundForTagError when the API returns 404 and tags were provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      httpRequestClient.get.mockReset();
      httpRequestClient.get.mockRejectedValue(new BotError(BotErrorType.GenericNotFoundError));
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await expect(repo.getRandomCatFile('nonexistent')).rejects.toMatchObject({
        errorType: BotErrorType.CatNotFoundForTagError,
      });
    });

    test('rethrows GenericNotFoundError as-is when no tags provided', async () => {
      const httpRequestClient = makeHttpRequestClient();
      httpRequestClient.get.mockReset();
      httpRequestClient.get.mockRejectedValue(new BotError(BotErrorType.GenericNotFoundError));
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      await expect(repo.getRandomCatFile()).rejects.toMatchObject({
        errorType: BotErrorType.GenericNotFoundError,
      });
    });
  });
});
