import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { DiscordApiRepository } from '@lib/repositories/discord-api';
import * as log from 'lambda-log';
import * as R from 'ramda';
import { BotConfigurationRepository } from '../repositories/bot-configuration';

interface Deps {
  botConfigurationRepository: BotConfigurationRepository;
  discordApiRepository: DiscordApiRepository;
}

export type DeleteBotRegistrationUsecase = (params: {
  serverId: string;
  channelId: string;
  token: string;
}) => Promise<void>;

export const makeDeleteBotRegistrationUsecase =
  (deps: Deps): DeleteBotRegistrationUsecase =>
  async (params) => {
    log.info('Deleting bot configuration', R.omit(['token'], params));
    await deps.botConfigurationRepository.delete(params);

    await deps.discordApiRepository.patchOriginalMessage({
      token: params.token,
      message: new DiscordWebhookMessage({
        content: 'Bot schedule deleted!',
      }),
    });
  };
