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

export const makeSendCatPhotoUsecase =
  (deps: Deps): SendCatPhotoUsecase =>
  async (params) => {
    logger.options.meta.params = R.omit(['token'], params);

    logger.info('Fetching cat photo', { tags: params.tags });
    let message: DiscordWebhookMessage;
    try {
      const catPhotoUrl = await deps.cataasApiRepository.getRandomCatPhotoUrl(params.tags);
      message = new DiscordWebhookMessage({ content: catPhotoUrl });
    } catch (error) {
      if (error instanceof BotError && error.errorType === BotErrorType.CatNotFoundForTagError) {
        const catPhotoUrl = await deps.cataasApiRepository.getRandomCatPhotoUrl();
        message = new DiscordWebhookMessage({
          content: `No cats found with provided tag, here's another one instead\n${catPhotoUrl}`,
        });
      } else {
        throw error;
      }
    }

    logger.info('Patching original message with cat photo');
    await deps.discordApiRepository.patchOriginalMessage({
      token: params.token,
      message,
    });
  };
