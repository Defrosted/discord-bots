import { configureBotInvocationSchema } from '@lib/schemas/events/wednesday-bot';
import logger from '@lib/util/logger';
import { makeRecordValidator } from '@lib/util/record-validator';
import * as R from 'ramda';
import { Config } from 'sst/node/config';
import { Table } from 'sst/node/table';
import { injectConfigureBotUsecase } from '../../di';
import { ConfigureBotUsecase } from '../../orchestration/configure-bot';

interface Deps {
  configureBot: ConfigureBotUsecase;
}

const validateEvent = (event: unknown) =>
  makeRecordValidator(configureBotInvocationSchema)(event);

export const makeHandler = (deps: Deps) => async (event: unknown) => {
  try {
    return await R.pipe(validateEvent, deps.configureBot)(event);
  } catch (error) {
    logger.error('Failed to configure bot', { error });
  }
};

const getConfig = () => ({
  region: Config.REGION,
  discordApiUrl: Config.DISCORD_API_URL,
  discordApplicationId: Config.DISCORD_APPLICATION_ID,
  discordAuthToken: Config.DISCORD_AUTH_TOKEN,
  botConfigurationTableName: Table.BotConfiguration.tableName,
});

export const handler = makeHandler({
  configureBot: injectConfigureBotUsecase(getConfig()),
});
