import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
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
    const catPhotoUrl = await deps.cataasApiRepository.getRandomCatPhotoUrl(
      params.tags,
    );

    const message = new DiscordWebhookMessage({ content: catPhotoUrl });

    logger.info('Patching original message with cat photo');
    await deps.discordApiRepository.patchOriginalMessage({
      token: params.token,
      message,
    });
  };
