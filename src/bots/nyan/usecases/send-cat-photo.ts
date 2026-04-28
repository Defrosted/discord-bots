import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { CataasApiRepository } from '@lib/repositories/cataas-api';
import { DiscordApiRepository } from '@lib/repositories/discord-api';
import logger from '@lib/util/logger';
import * as R from 'ramda';

interface Deps {
  discordApiRepository: DiscordApiRepository;
  cataasApiRepository: CataasApiRepository;
}

export interface SendCatPhotoUsecaseParams {
  token: string;
  channelId?: string;
  serverId?: string;
  tags?: string;
}

export type SendCatPhotoUsecase = (
  params: SendCatPhotoUsecaseParams,
) => Promise<void>;

const isGifTags = (tags?: string) => tags?.split(',').includes('gif') ?? false;

const getFilename = (id: string, isGif: boolean) =>
  `${id}.${isGif ? 'gif' : 'jpg'}`;

const getContentType = (isGif: boolean) => (isGif ? 'image/gif' : 'image/jpeg');

export const makeSendCatPhotoUsecase =
  (deps: Deps): SendCatPhotoUsecase =>
  async (params) => {
    logger.options.meta.params = R.omit(['token'], params);

    logger.info('Fetching cat file', { tags: params.tags });
    const gif = isGifTags(params.tags);
    let message: DiscordWebhookMessage;
    try {
      const { id, bytes } = await deps.cataasApiRepository.getRandomCatFile(params.tags);
      const filename = getFilename(id, gif);
      message = new DiscordWebhookMessage({
        content: '',
        files: [{ filename, bytes, content_type: getContentType(gif) }],
      });
    } catch (error) {
      if (error instanceof BotError && error.errorType === BotErrorType.CatNotFoundForTagError) {
        const { id, bytes } = await deps.cataasApiRepository.getRandomCatFile();
        const filename = getFilename(id, gif);
        message = new DiscordWebhookMessage({
          content: "No cats found with provided tag, here's another one instead",
          files: [{ filename, bytes, content_type: getContentType(gif) }],
        });
      } else {
        throw error;
      }
    }

    logger.info('Patching original message with cat file');
    await deps.discordApiRepository.patchOriginalMessage({
      token: params.token,
      message,
    });
  };
