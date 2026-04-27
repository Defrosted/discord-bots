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
  data: { name: 'itiswednesday', options: [] },
  ...overrides,
});

const REPO_DEPS = {
  sendWednesdayMemeFunctionName: 'send-fn',
  configureWednesdayFunctionName: 'config-fn',
};

describe('makeBotCommandRepository', () => {
  describe('sendWednesdayMeme', () => {
    test('invokes the send-meme Lambda with the correct function name', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, ...REPO_DEPS });

      await repo.sendWednesdayMeme(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ FunctionName: 'send-fn' }),
      );
    });

    test('passes serverId, channelId, and token in the payload', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, ...REPO_DEPS });

      await repo.sendWednesdayMeme(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({
            serverId: 'server-123',
            channelId: 'channel-456',
            token: 'interaction-token',
          }),
        }),
      );
    });

    test('uses Event invocation type', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, ...REPO_DEPS });

      await repo.sendWednesdayMeme(makeInteraction());

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ InvocationType: InvocationType.Event }),
      );
    });
  });

  describe('configureBot', () => {
    test('invokes the configure Lambda with the correct function name', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, ...REPO_DEPS });
      const interaction = makeInteraction({
        data: { name: 'wednesday', options: [{ name: 'register', type: 1, options: [] }] },
      });

      await repo.configureBot(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ FunctionName: 'config-fn' }),
      );
    });

    test('includes options in the payload', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, ...REPO_DEPS });
      const options = [{ name: 'register', type: 1, options: [] }];
      const interaction = makeInteraction({ data: { name: 'wednesday', options } });

      await repo.configureBot(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({
          Payload: expect.objectContaining({ options }),
        }),
      );
    });

    test('throws when serverId (guild_id) is missing from the interaction', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, ...REPO_DEPS });
      const interaction = makeInteraction({
        guild_id: undefined,
        data: { name: 'wednesday', options: [{ name: 'register', type: 1, options: [] }] },
      });

      await expect(repo.configureBot(interaction)).rejects.toThrow();
    });

    test('uses Event invocation type', async () => {
      const lambdaClient = makeLambdaClient();
      const repo = makeBotCommandRepository({ lambdaClient, ...REPO_DEPS });
      const interaction = makeInteraction({
        data: { name: 'wednesday', options: [{ name: 'register', type: 1, options: [] }] },
      });

      await repo.configureBot(interaction);

      expect(lambdaClient.invoke).toHaveBeenCalledWith(
        expect.objectContaining({ InvocationType: InvocationType.Event }),
      );
    });
  });
});
