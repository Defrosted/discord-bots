import { describe, expect, test, vi } from 'vitest';
import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { makeDiscordApiRepository } from './discord-api';

const makeHttpClient = () => ({
  get: vi.fn(),
  post: vi.fn().mockResolvedValue(undefined),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn().mockResolvedValue(undefined),
});

const BASE_DEPS = {
  discordApiUrl: 'https://discord.com/api/v10',
  applicationId: 'app-123',
  authToken: 'bot-token-456',
};

describe('makeDiscordApiRepository', () => {
  describe('patchOriginalMessage', () => {
    test('calls patch on the correct Discord webhook URL', async () => {
      const httpRequestClient = makeHttpClient();
      const repo = makeDiscordApiRepository({ ...BASE_DEPS, httpRequestClient });
      const message = new DiscordWebhookMessage({ content: 'hello' });

      await repo.patchOriginalMessage({ token: 'tok123', message });

      expect(httpRequestClient.patch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/webhooks/app-123/tok123/messages/@original',
        expect.any(Object),
      );
    });

    test('sets Content-Type header from message content type', async () => {
      const httpRequestClient = makeHttpClient();
      const repo = makeDiscordApiRepository({ ...BASE_DEPS, httpRequestClient });
      const message = new DiscordWebhookMessage({ content: 'hello' });

      await repo.patchOriginalMessage({ token: 'tok123', message });

      const [, params] = httpRequestClient.patch.mock.calls[0];
      expect(params.headers['Content-Type']).toBe('application/json');
    });

    test('passes the message request body as data', async () => {
      const httpRequestClient = makeHttpClient();
      const repo = makeDiscordApiRepository({ ...BASE_DEPS, httpRequestClient });
      const message = new DiscordWebhookMessage({ content: 'hello' });

      await repo.patchOriginalMessage({ token: 'tok123', message });

      const [, params] = httpRequestClient.patch.mock.calls[0];
      expect(params.data).toMatchObject({ content: 'hello' });
    });
  });

  describe('postMessageToChannel', () => {
    test('calls post on the correct Discord channel URL', async () => {
      const httpRequestClient = makeHttpClient();
      const repo = makeDiscordApiRepository({ ...BASE_DEPS, httpRequestClient });
      const message = new DiscordWebhookMessage({ content: 'hello' });

      await repo.postMessageToChannel({ channelId: 'ch-789', message });

      expect(httpRequestClient.post).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/ch-789/messages',
        expect.any(Object),
      );
    });

    test('includes bot auth token in Authorization header', async () => {
      const httpRequestClient = makeHttpClient();
      const repo = makeDiscordApiRepository({ ...BASE_DEPS, httpRequestClient });
      const message = new DiscordWebhookMessage({ content: 'hello' });

      await repo.postMessageToChannel({ channelId: 'ch-789', message });

      const [, params] = httpRequestClient.post.mock.calls[0];
      expect(params.headers.Authorization).toBe('Bot bot-token-456');
    });

    test('sets Content-Type header from message content type', async () => {
      const httpRequestClient = makeHttpClient();
      const repo = makeDiscordApiRepository({ ...BASE_DEPS, httpRequestClient });
      const message = new DiscordWebhookMessage({ content: 'hello' });

      await repo.postMessageToChannel({ channelId: 'ch-789', message });

      const [, params] = httpRequestClient.post.mock.calls[0];
      expect(params.headers['Content-Type']).toBe('application/json');
    });
  });
});
