import { describe, expect, test, vi } from 'vitest';
import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { makeSendCatPhotoUsecase } from './send-cat-photo';

const CAT_ID = 'abc123';
const CAT_BLOB = new Blob(['cat-bytes']);
const CAT_FILE = { id: CAT_ID, bytes: CAT_BLOB };

const makeDeps = () => ({
  discordApiRepository: {
    patchOriginalMessage: vi.fn().mockResolvedValue(undefined),
    postMessageToChannel: vi.fn().mockResolvedValue(undefined),
  },
  cataasApiRepository: {
    getRandomCatFile: vi.fn().mockResolvedValue(CAT_FILE),
  },
});

describe('makeSendCatPhotoUsecase', () => {
  test('fetches a cat file', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1', serverId: 's1' });

    expect(deps.cataasApiRepository.getRandomCatFile).toHaveBeenCalledTimes(1);
  });

  test('passes tags to the cataas repository when provided', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1', tags: 'cute' });

    expect(deps.cataasApiRepository.getRandomCatFile).toHaveBeenCalledWith('cute');
  });

  test('calls getRandomCatFile without tags when not provided', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1' });

    expect(deps.cataasApiRepository.getRandomCatFile).toHaveBeenCalledWith(undefined);
  });

  test('patches the original Discord message', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok123', channelId: 'ch1' });

    expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledTimes(1);
    expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok123' }),
    );
  });

  test('sends a DiscordWebhookMessage with the cat file as an attachment', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1' });

    const call = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(call.message).toBeInstanceOf(DiscordWebhookMessage);
    expect(call.message.files).toHaveLength(1);
    expect(call.message.files[0].bytes).toBe(CAT_BLOB);
  });

  test('uses the cat id with .jpg extension for photo tags', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1', tags: 'cute' });

    const call = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(call.message.files[0].filename).toBe(`${CAT_ID}.jpg`);
    expect(call.message.files[0].content_type).toBe('image/jpeg');
  });

  test('uses the cat id with .gif extension when tags include gif', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1', tags: 'gif,orange' });

    const call = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(call.message.files[0].filename).toBe(`${CAT_ID}.gif`);
    expect(call.message.files[0].content_type).toBe('image/gif');
  });

  test('does not call postMessageToChannel', async () => {
    const deps = makeDeps();
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1' });

    expect(deps.discordApiRepository.postMessageToChannel).not.toHaveBeenCalled();
  });

  test('fetches a random cat and sends fallback message with attachment when no cat found for tag', async () => {
    const FALLBACK_FILE = { id: 'fallback', bytes: new Blob(['fallback-bytes']) };
    const deps = makeDeps();
    deps.cataasApiRepository.getRandomCatFile
      .mockRejectedValueOnce(new BotError(BotErrorType.CatNotFoundForTagError))
      .mockResolvedValueOnce(FALLBACK_FILE);
    const usecase = makeSendCatPhotoUsecase(deps);

    await usecase({ token: 'tok', channelId: 'ch1', tags: 'nonexistent' });

    expect(deps.cataasApiRepository.getRandomCatFile).toHaveBeenCalledTimes(2);
    expect(deps.cataasApiRepository.getRandomCatFile).toHaveBeenLastCalledWith();
    const call = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(call.message.content).toContain("No cats found with provided tag, here's another one instead");
    expect(call.message.files[0].bytes).toBe(FALLBACK_FILE.bytes);
  });

  test('rethrows non-tag-not-found errors', async () => {
    const deps = makeDeps();
    deps.cataasApiRepository.getRandomCatFile.mockRejectedValue(
      new BotError(BotErrorType.InfrastructureError),
    );
    const usecase = makeSendCatPhotoUsecase(deps);

    await expect(usecase({ token: 'tok', channelId: 'ch1' })).rejects.toMatchObject({
      errorType: BotErrorType.InfrastructureError,
    });
  });
});
