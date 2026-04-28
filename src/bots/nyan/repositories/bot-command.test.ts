import { InvocationType } from '@aws-sdk/client-lambda';
import { describe, expect, test, vi } from 'vitest';
import { DiscordInteractionType } from '@lib/constants';
import { makeBotCommandRepository } from './bot-command';

const makeLambdaClient = () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
});

const makeInteraction = (overrides = {}) => ({
  id: '1',
  type: DiscordInteractionType.APPLICATION_COMMAND,
  token: 'interaction-token',
  guild_id: 'server-123',
  channel_id: 'channel-456',
  data: { name: 'cat', options: [] },
  ...overrides,
});

describe('makeBotCommandRepository', () => {
  describe('sendCatPhoto', () => {
    test('invokes the send-cat-photo Lambda with the correct function name', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });

      await repo.sendCatPhoto(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ FunctionName: 'cat-fn' }),
      );
    });

    test('passes token, channelId, and serverId in the payload', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });

      await repo.sendCatPhoto(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({
            token: 'interaction-token',
            channelId: 'channel-456',
            serverId: 'server-123',
          }),
        }),
      );
    });

    test('includes tags in payload when a tags option is present', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });
      const interaction = makeInteraction({
        data: { name: 'cat', options: [{ name: 'tags', type: 3, value: 'cute' }] },
      });

      await repo.sendCatPhoto(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({ tags: 'cute' }),
        }),
      );
    });

    test('tags is undefined in payload when no tags option is present', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });

      await repo.sendCatPhoto(makeInteraction());

      const payload = (lambdaClient.invoke.mock.calls[0][0] as { Payload: { tags?: string } }).Payload;
      expect(payload.tags).toBeUndefined();
    });

    test('uses Event invocation type', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });

      await repo.sendCatPhoto(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ InvocationType: InvocationType.Event }),
      );
    });
  });
});
