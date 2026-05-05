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
  data: { name: 'cat', options: [{ name: 'image', type: 1, options: [] }] },
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

    test('includes tags in payload when a tags option is present on the subcommand', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });
      const interaction = makeInteraction({
        data: { name: 'cat', options: [{ name: 'image', type: 1, options: [{ name: 'tags', type: 3, value: 'cute' }] }] },
      });

      await repo.sendCatPhoto(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({ tags: 'cute' }),
        }),
      );
    });

    test('includes text in payload when a text option is present on the subcommand', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });
      const interaction = makeInteraction({
        data: { name: 'cat', options: [{ name: 'image', type: 1, options: [{ name: 'text', type: 3, value: 'hello' }] }] },
      });

      await repo.sendCatPhoto(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({ text: 'hello' }),
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

  describe('sendCatGif', () => {
    test('invokes the send-cat-photo Lambda with the correct function name', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });

      await repo.sendCatGif(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ FunctionName: 'cat-fn' }),
      );
    });

    test('passes token, channelId, serverId, and gif tag when no user tags provided', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });

      await repo.sendCatGif(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({
            token: 'interaction-token',
            channelId: 'channel-456',
            serverId: 'server-123',
            tags: 'gif',
          }),
        }),
      );
    });

    test('includes text in payload for gif command', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });
      const interaction = makeInteraction({
        data: { name: 'cat', options: [{ name: 'gif', type: 1, options: [{ name: 'text', type: 3, value: 'meow' }] }] },
      });

      await repo.sendCatGif(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({ text: 'meow' }),
        }),
      );
    });

    test('prepends gif to user-provided tags', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });
      const interaction = makeInteraction({
        data: { name: 'cat', options: [{ name: 'gif', type: 1, options: [{ name: 'tags', type: 3, value: 'orange' }] }] },
      });

      await repo.sendCatGif(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({ tags: 'gif,orange' }),
        }),
      );
    });

    test('uses Event invocation type', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, sendCatPhotoFunctionName: 'cat-fn' });

      await repo.sendCatGif(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ InvocationType: InvocationType.Event }),
      );
    });
  });
});
