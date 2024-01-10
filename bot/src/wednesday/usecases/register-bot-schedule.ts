import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { DiscordApiRepository } from '@lib/repositories/discord-api';
import * as log from 'lambda-log';
import * as R from 'ramda';
import { BotConfiguration } from '../domain/bot-configuration';
import { BotConfigurationRepository } from '../repositories/bot-configuration';

interface Deps {
  botConfigurationRepository: BotConfigurationRepository;
  discordApiRepository: DiscordApiRepository;
}

export type RegisterBotScheduleUsecase = (params: {
  serverId: string;
  channelId: string;
  token: string;
}) => Promise<void>;

export const makeRegisterBotScheduleUsecase =
  (deps: Deps): RegisterBotScheduleUsecase =>
  async (params) => {
    log.info('Registering bot configuration', R.omit(['token'], params));
    await deps.botConfigurationRepository.put(new BotConfiguration(params));

    await deps.discordApiRepository.patchOriginalMessage({
      token: params.token,
      message: new DiscordWebhookMessage({
        content: 'Registration complete!',
      }),
    });
  };
