import { describe, expect, test, vi } from 'vitest';
import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { makeSendCatPhotoUsecase } from './send-cat-photo';

const CAT_URL = 'https://cataas.com/cat/abc123';

const makeDeps = () => ({
  discordApiRepository: {
    patchOriginalMessage: vi.fn().mockResolvedValue(undefined),
    postMessageToChannel: vi.fn().mockResolvedValue(undefined),
  },
  cataasApiRepository: {
    getRandomCatPhotoUrl: vi.fn().mockResolvedValue(CAT_URL),
  },
});

describe('makeSendCatPhotoUsecase', () => {
  test('fetches a cat photo URL', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1', serverId: 's1' });

    expect(deps.cataasApiRepository.getRandomCatPhotoUrl).toHaveBeenCalledTimes(1);
  });

  test('passes tags to the cataas repository when provided', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1', tags: 'cute' });

    expect(deps.cataasApiRepository.getRandomCatPhotoUrl).toHaveBeenCalledWith('cute');
  });

  test('calls getRandomCatPhotoUrl without tags when not provided', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1' });

    expect(deps.cataasApiRepository.getRandomCatPhotoUrl).toHaveBeenCalledWith(undefined);
  });

  test('patches the original Discord message with the cat embed', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok123', channelId: 'ch1' });

    expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledTimes(1);
    expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok123' }),
    );
  });

  test('sends a DiscordWebhookMessage with the cat photo URL as content', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1' });

    const call = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(call.message).toBeInstanceOf(DiscordWebhookMessage);
    expect(call.message.content).toBe(CAT_URL);
  });

  test('sends no embeds', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1' });

    const call = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(call.message.embeds).toHaveLength(0);
  });

  test('does not call postMessageToChannel', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1' });

    expect(deps.discordApiRepository.postMessageToChannel).not.toHaveBeenCalled();
  });
});
