import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { CatFile, CataasApiRepository } from '@lib/repositories/cataas-api';
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
  text?: string;
}

export type SendCatPhotoUsecase = (
  params: SendCatPhotoUsecaseParams,
) => Promise<void>;

const isGifTags = (tags?: string) => tags?.split(',').includes('gif') ?? false;

const getFilename = (id: string, isGif: boolean) =>
  `${id}.${isGif ? 'gif' : 'jpg'}`;

const getContentType = (isGif: boolean) => (isGif ? 'image/gif' : 'image/jpeg');

const MAX_FETCH_ATTEMPTS = 5;

export const makeSendCatPhotoUsecase =
  (deps: Deps): SendCatPhotoUsecase =>
  async (params) => {
    logger.options.meta.params = R.omit(['token'], params);

    logger.info('Fetching cat file', { tags: params.tags });
    const gif = isGifTags(params.tags);
    const fallbackTags = gif ? 'gif' : undefined;

    let content = '';
    let lastError: unknown;

    const fetchCat = async (
      tags: string | undefined,
      attempt: number,
    ): Promise<CatFile> => {
      try {
        return await deps.cataasApiRepository.getRandomCatFile(tags, params.text);
      } catch (error) {
        lastError = error;
        if (attempt >= MAX_FETCH_ATTEMPTS) throw error;

        if (
          error instanceof BotError &&
          error.errorType === BotErrorType.CatNotFoundForTagError
        ) {
          content =
            "No cats found with provided tag, here's another one instead";
        } else if (!content) {
          content =
            "Something went wrong fetching your cat, here's another one instead";
        }

        logger.warn(
          `Failed to fetch cat file (attempt ${attempt}/${MAX_FETCH_ATTEMPTS}), retrying`,
          { error },
        );
        return fetchCat(fallbackTags, attempt + 1);
      }
    };

    let message: DiscordWebhookMessage;
    try {
      const { id, bytes } = await fetchCat(params.tags, 1);
      const filename = getFilename(id, gif);
      message = new DiscordWebhookMessage({
        content,
        files: [{ filename, bytes, content_type: getContentType(gif) }],
      });
    } catch (error) {
      logger.error('All fetch attempts failed', { error });
      message = new DiscordWebhookMessage({
        content:
          "Despite trying my hardest I couldn't get you a cat right now. Please try again later!",
      });
    }

    logger.info('Patching original message with cat file');
    await deps.discordApiRepository.patchOriginalMessage({
      token: params.token,
      message,
    });
  };
