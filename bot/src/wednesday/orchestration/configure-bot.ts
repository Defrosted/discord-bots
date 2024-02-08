import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { DiscordInteractionOption } from '@lib/schemas/shared/discord';
import logger from '@lib/util/logger';
import * as R from 'ramda';
import { WednesdayConfigureSubCommands } from '../constants';
import { DeleteBotRegistrationUsecase } from '../usecases/delete-bot-registration';
import { RegisterBotScheduleUsecase } from '../usecases/register-bot-schedule';

interface Deps {
  registerBotSchedule: RegisterBotScheduleUsecase;
  deleteBotRegistration: DeleteBotRegistrationUsecase;
}

export type ConfigureBotUsecase = (params: {
  serverId: string;
  channelId: string;
  token: string;
  options: DiscordInteractionOption[];
}) => Promise<void>;

export const makeConfigureBotUsecase =
  (deps: Deps): ConfigureBotUsecase =>
  (params) => {
    logger.options.meta.params = R.omit(['token'], params);

    const subCommand = params.options.shift()?.name;
    if (!subCommand)
      throw new BotError(BotErrorType.InvalidInputError, {
        logDetails: params,
      });

    switch (subCommand) {
      case WednesdayConfigureSubCommands.REGISTER:
        return deps.registerBotSchedule(params);
      case WednesdayConfigureSubCommands.DEREGISTER:
        return deps.deleteBotRegistration(params);
      default:
        throw new BotError(BotErrorType.CommandNotFoundError, {
          logDetails: params,
        });
    }
  };
