import { describe, expect, test, vi } from 'vitest';
import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { RedditEmbed } from '@lib/domain/reddit-embed';
import { makeSendWednesdayMemeUsecase } from './send-wednesday-meme';

const makeRedditEmbed = (isVideo = false) =>
  new RedditEmbed({
    title: 'Test Meme',
    url: 'https://i.redd.it/meme.jpg',
    description: 'Test Meme',
    isVideo,
  });

const makeDeps = () => ({
  dynamoDbClient: {} as never,
  discordApiRepository: {
    patchOriginalMessage: vi.fn().mockResolvedValue(undefined),
    postMessageToChannel: vi.fn().mockResolvedValue(undefined),
  },
  botConfigurationRepository: {
    getAll: vi.fn().mockResolvedValue([{ channelId: 'ch1' }, { channelId: 'ch2' }]),
    put: vi.fn(),
    delete: vi.fn(),
  },
  redditApiRepository: {
    getRandomPostEmbed: vi.fn().mockResolvedValue(makeRedditEmbed()),
    getFirstTopLevelPostEmbed: vi.fn().mockResolvedValue(makeRedditEmbed()),
  },
});

describe('makeSendWednesdayMemeUsecase', () => {
  test('fetches a Reddit embed regardless of params', async () => {
    const deps = makeDeps();
    const usecase = makeSendWednesdayMemeUsecase(deps);

    await usecase(undefined);

    expect(deps.redditApiRepository.getRandomPostEmbed).toHaveBeenCalledTimes(1);
  });

  describe('when params are provided (slash command flow)', () => {
    test('patches the original Discord message', async () => {
      const deps = makeDeps();
      const usecase = makeSendWednesdayMemeUsecase(deps);

      await usecase({ serverId: 's1', channelId: 'c1', token: 'tok123' });

      expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledTimes(1);
      expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'tok123' }),
      );
    });

    test('passes a DiscordWebhookMessage to patchOriginalMessage', async () => {
      const deps = makeDeps();
      const usecase = makeSendWednesdayMemeUsecase(deps);

      await usecase({ serverId: 's1', channelId: 'c1', token: 'tok123' });

      const call = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
      expect(call.message).toBeInstanceOf(DiscordWebhookMessage);
    });

    test('does not broadcast to configured channels', async () => {
      const deps = makeDeps();
      const usecase = makeSendWednesdayMemeUsecase(deps);

      await usecase({ serverId: 's1', channelId: 'c1', token: 'tok123' });

      expect(deps.botConfigurationRepository.getAll).not.toHaveBeenCalled();
      expect(deps.discordApiRepository.postMessageToChannel).not.toHaveBeenCalled();
    });
  });

  describe('when no params are provided (scheduled broadcast flow)', () => {
    test('loads all bot configurations', async () => {
      const deps = makeDeps();
      const usecase = makeSendWednesdayMemeUsecase(deps);

      await usecase(undefined);

      expect(deps.botConfigurationRepository.getAll).toHaveBeenCalledTimes(1);
    });

    test('posts the message to every configured channel', async () => {
      const deps = makeDeps();
      const usecase = makeSendWednesdayMemeUsecase(deps);

      await usecase(undefined);

      expect(deps.discordApiRepository.postMessageToChannel).toHaveBeenCalledTimes(2);
      expect(deps.discordApiRepository.postMessageToChannel).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: 'ch1' }),
      );
      expect(deps.discordApiRepository.postMessageToChannel).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: 'ch2' }),
      );
    });

    test('does not patch the original message', async () => {
      const deps = makeDeps();
      const usecase = makeSendWednesdayMemeUsecase(deps);

      await usecase(undefined);

      expect(deps.discordApiRepository.patchOriginalMessage).not.toHaveBeenCalled();
    });

    test('sends no messages when there are no configured channels', async () => {
      const deps = makeDeps();
      deps.botConfigurationRepository.getAll.mockResolvedValue([]);
      const usecase = makeSendWednesdayMemeUsecase(deps);

      await usecase(undefined);

      expect(deps.discordApiRepository.postMessageToChannel).not.toHaveBeenCalled();
    });
  });
});
