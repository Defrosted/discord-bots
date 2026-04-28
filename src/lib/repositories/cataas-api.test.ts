import { describe, expect, test, vi } from 'vitest';
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

    test('returns /cat/{id} URL for the cat returned by the API', async () => {
      const httpRequestClient = makeHttpRequestClient();
      httpRequestClient.get.mockResolvedValue({ id: 'deadbeef' });
      const repo = makeCataasApiRepository({ httpRequestClient, cataasApiUrl: CATAAS_API_URL });

      const result = await repo.getRandomCatPhotoUrl();

      expect(result).toBe(`${CATAAS_API_URL}/cat/deadbeef`);
    });
  });
});
