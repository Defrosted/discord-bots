import { DynamoDbClient } from '@lib/adapters/dynamodb-client';
import { DiscordWebhookMessage } from '@lib/domain/discord-webhook-message';
import { DiscordApiRepository } from '@lib/repositories/discord-api';
import { RedditApiRepository } from '@lib/repositories/reddit-api';
import logger from '@lib/util/logger';
import * as R from 'ramda';
import { BotConfigurationRepository } from '../repositories/bot-configuration';

interface Deps {
  dynamoDbClient: DynamoDbClient;
  discordApiRepository: DiscordApiRepository;
  botConfigurationRepository: BotConfigurationRepository;
  redditApiRepository: RedditApiRepository;
}

export type SendWednesdayMemeUsecaseParams =
  | {
      serverId: string;
      channelId: string;
      token: string;
    }
  | undefined;
export type SendWednesdayMemeUsecase = (
  params: SendWednesdayMemeUsecaseParams,
) => Promise<void>;

export const makeSendWednesdayMemeUsecase =
  (deps: Deps): SendWednesdayMemeUsecase =>
  async (params) => {
    logger.options.meta.params = R.omit(['token'], params);

    const message = new DiscordWebhookMessage({
      content: 'It is Wednesday my dudes!',
    });

    logger.info('Fetching Reddit embed');
    const redditEmbed = await deps.redditApiRepository.getRandomPostEmbed();
    message.addRedditEmbed(redditEmbed);

    // Patch original message when called with it and exit
    if (params) {
      logger.info('Patching original message with embed', {
        message: message.toObject(),
      });
      await deps.discordApiRepository.patchOriginalMessage({
        token: params.token,
        message,
      });
      return;
    }

    // Send message to all configured channels
    const configurations = await deps.botConfigurationRepository.getAll();
    logger.info(`Sending embed to ${configurations.length} channels`);

    await Promise.all(
      configurations.map(({ channelId }) =>
        deps.discordApiRepository.postMessageToChannel({
          channelId,
          message,
        }),
      ),
    );
  };
