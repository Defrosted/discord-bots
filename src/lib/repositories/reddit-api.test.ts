import { describe, expect, test, vi } from 'vitest';
import { BotErrorType } from '@lib/errors/bot-error';
import { RedditEmbed } from '@lib/domain/reddit-embed';
import { makeRedditApiRepository } from './reddit-api';

const API_URL = 'https://oauth.reddit.com/r/Unexpected';

const makePost = (overrides: Record<string, unknown> = {}) => ({
  kind: 't3',
  data: { url: 'https://i.redd.it/image.jpg', title: 'Test post', is_video: false, ...overrides },
});

const makeOauthClient = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
});

describe('makeRedditApiRepository', () => {
  describe('getRandomPostEmbed', () => {
    test('fetches from the top endpoint', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue({ kind: 'Listing', data: { children: [makePost()] } });
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      await repo.getRandomPostEmbed();

      expect(oauthClient.get).toHaveBeenCalledWith(`${API_URL}/top?limit=100&t=all`, expect.any(Object));
    });

    test('returns a RedditEmbed from a valid post', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue({
        kind: 'Listing',
        data: { children: [makePost({ url: 'https://example.com/img.jpg' })] },
      });
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      const result = await repo.getRandomPostEmbed();

      expect(result).toBeInstanceOf(RedditEmbed);
      expect(result.url).toBe('https://example.com/img.jpg');
    });

    test('filters out posts where kind is not t3', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue({
        kind: 'Listing',
        data: {
          children: [
            { kind: 't1', data: { url: 'https://comment.com', title: 'Comment', is_video: false } },
            makePost({ url: 'https://valid.com/img' }),
          ],
        },
      });
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      const result = await repo.getRandomPostEmbed();

      expect(result.url).toBe('https://valid.com/img');
    });

    test('filters out posts without a URL', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue({
        kind: 'Listing',
        data: {
          children: [
            { kind: 't3', data: { title: 'No URL post', is_video: false } },
            makePost({ url: 'https://valid.com/img' }),
          ],
        },
      });
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      const result = await repo.getRandomPostEmbed();

      expect(result.url).toBe('https://valid.com/img');
    });

    test('throws RandomRedditPostNotFoundError when no valid posts remain after filtering', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue({
        kind: 'Listing',
        data: {
          children: [{ kind: 't1', data: { title: 'Comment', is_video: false } }],
        },
      });
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      await expect(repo.getRandomPostEmbed()).rejects.toThrow(
        expect.objectContaining({ errorType: BotErrorType.RandomRedditPostNotFoundError }),
      );
    });

    test('throws RandomRedditPostNotFoundError when listing is empty', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue({ kind: 'Listing', data: { children: [] } });
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      await expect(repo.getRandomPostEmbed()).rejects.toThrow(
        expect.objectContaining({ errorType: BotErrorType.RandomRedditPostNotFoundError }),
      );
    });
  });

  describe('getFirstTopLevelPostEmbed', () => {
    test('fetches from the random endpoint', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue([
        { kind: 'Listing', data: { children: [makePost()] } },
      ]);
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      await repo.getFirstTopLevelPostEmbed();

      expect(oauthClient.get).toHaveBeenCalledWith(`${API_URL}/random`, expect.any(Object));
    });

    test('returns the first valid post as a RedditEmbed', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue([
        {
          kind: 'Listing',
          data: {
            children: [
              makePost({ url: 'https://first.com/img', title: 'First post' }),
              makePost({ url: 'https://second.com/img', title: 'Second post' }),
            ],
          },
        },
      ]);
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      const result = await repo.getFirstTopLevelPostEmbed();

      expect(result).toBeInstanceOf(RedditEmbed);
      expect(result.url).toBe('https://first.com/img');
    });

    test('filters out non-t3 posts before selecting', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue([
        {
          kind: 'Listing',
          data: {
            children: [
              { kind: 't1', data: { url: 'https://comment.com', title: 'Comment', is_video: false } },
              makePost({ url: 'https://valid.com/img' }),
            ],
          },
        },
      ]);
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      const result = await repo.getFirstTopLevelPostEmbed();

      expect(result.url).toBe('https://valid.com/img');
    });

    test('throws RandomRedditPostNotFoundError when the listing has no valid posts', async () => {
      const oauthClient = makeOauthClient();
      oauthClient.get.mockResolvedValue([
        { kind: 'Listing', data: { children: [] } },
      ]);
      const repo = makeRedditApiRepository({ oauthClient, apiUrl: API_URL });

      await expect(repo.getFirstTopLevelPostEmbed()).rejects.toThrow(
        expect.objectContaining({ errorType: BotErrorType.RandomRedditPostNotFoundError }),
      );
    });
  });
});
