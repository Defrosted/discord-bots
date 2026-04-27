import { DynamoDbClient } from '@lib/adapters/dynamodb-client';
import * as R from 'ramda';
import {
  BotConfiguration,
  IBotConfiguration,
} from '../domain/bot-configuration';

interface Deps {
  botConfigurationTableName: string;
  dynamoDbClient: DynamoDbClient;
}

export interface BotConfigurationRepository {
  getAll: () => Promise<BotConfiguration[]>;
  put: (configuration: BotConfiguration) => Promise<void>;
  delete: (
    configuration: Pick<BotConfiguration, 'serverId' | 'channelId'>,
  ) => Promise<void>;
}

export const makeBotConfigurationRepository = (
  deps: Deps,
): BotConfigurationRepository => ({
  getAll: async () => {
    const configurations = await deps.dynamoDbClient.scan<IBotConfiguration>(
      deps.botConfigurationTableName,
    );

    return configurations.map((config) => new BotConfiguration(config));
  },
  put: async (configuration) => {
    await deps.dynamoDbClient.put(deps.botConfigurationTableName, {
      ...configuration.toObject(),
    });
  },
  delete: async (configuration) => {
    await deps.dynamoDbClient.delete(
      deps.botConfigurationTableName,
      R.pick(['serverId', 'channelId'], configuration),
    );
  },
});
