import {
  SendWednesdayMemeInvocation,
  sendWednesdayMemeInvocationSchema,
} from '@lib/schemas/events/wednesday-bot';
import logger from '@lib/util/logger';
import { makeRecordValidator } from '@lib/util/record-validator';
import * as R from 'ramda';
import { Config } from 'sst/node/config';
import { Table } from 'sst/node/table';
import { injectSendWednesdayMemeUsecase } from '../../di';
import {
  SendWednesdayMemeUsecase,
  SendWednesdayMemeUsecaseParams,
} from '../../usecases/send-wednesday-meme';

interface Deps {
  sendWednesdayMeme: SendWednesdayMemeUsecase;
}

const validateEvent = (event: unknown) =>
  makeRecordValidator(sendWednesdayMemeInvocationSchema)(event);

const toParams = (
  input: SendWednesdayMemeInvocation,
): SendWednesdayMemeUsecaseParams =>
  Object.keys(input).length > 0
    ? (input as SendWednesdayMemeUsecaseParams)
    : undefined;

export const makeHandler = (deps: Deps) => async (event: unknown) => {
  try {
    return await R.pipe(validateEvent, toParams, deps.sendWednesdayMeme)(event);
  } catch (error) {
    logger.error('Failed to send wednesday meme', { error });
  }
};

const getConfig = () => ({
  region: Config.REGION,
  discordApiUrl: Config.DISCORD_API_URL,
  discordApplicationId: Config.DISCORD_APPLICATION_ID,
  discordAuthToken: Config.DISCORD_AUTH_TOKEN,
  botConfigurationTableName: Table.BotConfiguration.tableName,
  redditClientId: Config.REDDIT_CLIENT_ID,
  redditClientSecret: Config.REDDIT_CLIENT_SECRET,
  redditAuthUrl: Config.REDDIT_AUTH_URL,
  redditApiUrl: Config.REDDIT_API_URL,
  redditUserAgent: Config.REDDIT_USER_AGENT,
});

export const handler = makeHandler({
  sendWednesdayMeme: injectSendWednesdayMemeUsecase(getConfig()),
});
