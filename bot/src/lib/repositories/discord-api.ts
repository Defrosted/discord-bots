import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { HttpRequestClient } from '../adapters/http-client';

interface Deps {
  httpRequestClient: HttpRequestClient;
  discordApiUrl: string;
  applicationId: string;
  authToken: string;
}

export interface DiscordApiRepository {
  patchOriginalMessage: (params: {
    token: string;
    message: DiscordWebhookMessage;
  }) => Promise<unknown>;
  postMessageToChannel: (params: {
    channelId: string;
    message: DiscordWebhookMessage;
  }) => Promise<unknown>;
}

export const makeDiscordApiRepository = (deps: Deps): DiscordApiRepository => ({
  patchOriginalMessage: async (params) =>
    deps.httpRequestClient.patch(
      `${deps.discordApiUrl}/webhooks/${deps.applicationId}/${params.token}/messages/@original`,
      {
        headers: {
          'Content-Type': params.message.getContentType(),
        },
        data: params.message.toRequestBody(),
      },
    ),
  postMessageToChannel: async (params) =>
    deps.httpRequestClient.post(
      `${deps.discordApiUrl}/channels/${params.channelId}/messages`,
      {
        headers: {
          'Content-Type': params.message.getContentType(),
          Authorization: `Bot ${deps.authToken}`,
        },
        data: params.message.toRequestBody(),
      },
    ),
});
