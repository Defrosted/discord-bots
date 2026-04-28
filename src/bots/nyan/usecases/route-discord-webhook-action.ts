import { DiscordInteractionType } from '@lib/constants';
import {
  DiscordInteractionReply,
  DiscordInteractionReplyType,
} from '@lib/domain/discord-webhook-interaction';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { DiscordInteraction } from '@lib/schemas/shared/discord';
import logger from '@lib/util/logger';
import * as R from 'ramda';
import { NyanCommands, NyanSubCommands } from '../constants';
import { BotCommandRepository } from '../repositories/bot-command';

export type RouteDiscordWebhookActionUsecase = (
  params: DiscordInteraction,
) => Promise<DiscordInteractionReply>;

interface Deps {
  botCommandRepository: BotCommandRepository;
}

export const makeRouteDiscordWebhookActionUsecase =
  (deps: Deps): RouteDiscordWebhookActionUsecase =>
  async (interaction) => {
    logger.info(
      'Processing discord webhook action',
      R.omit(['token'], interaction),
    );

    if (interaction.type === DiscordInteractionType.PING) {
      logger.info('Responding to PING event');
      return {
        type: DiscordInteractionReplyType.PONG,
      };
    }

    const command = interaction.data?.name;
    switch (command) {
      case NyanCommands.CAT: {
        const subCommand = interaction.data?.options?.[0]?.name;
        if (subCommand === NyanSubCommands.GIF) {
          await deps.botCommandRepository.sendCatGif(interaction);
          logger.info('Invoked send cat gif function, returning initial message');
        } else {
          await deps.botCommandRepository.sendCatPhoto(interaction);
          logger.info('Invoked send cat photo function, returning initial message');
        }
        return {
          type: DiscordInteractionReplyType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        };
      }
      default:
        throw new BotError(BotErrorType.CommandNotFoundError, {
          logDetails: interaction,
        });
    }
  };
