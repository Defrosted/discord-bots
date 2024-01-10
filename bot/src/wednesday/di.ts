import {
  injectDiscordApiRepository,
  injectDynamoDbClient,
  injectLambdaClient,
  injectRedditApiRepository,
} from '@lib/di';
import { makeConfigureBotUsecase } from './orchestration/configure-bot';
import { makeBotCommandRepository } from './repositories/bot-command';
import { makeBotConfigurationRepository } from './repositories/bot-configuration';
import { makeDeleteBotRegistrationUsecase } from './usecases/delete-bot-registration';
import { makeRegisterBotScheduleUsecase } from './usecases/register-bot-schedule';
import { makeRouteDiscordWebhookActionUsecase } from './usecases/route-discord-webhook-action';
import { makeSendWednesdayMemeUsecase } from './usecases/send-wednesday-meme';

/* Repositories */
export const injectBotCommandRepository = (config: {
  region: string;
  sendWednesdayMemeFunctionName: string;
  configureWednesdayFunctionName: string;
}) =>
  makeBotCommandRepository({
    lambdaClient: injectLambdaClient(config),
    sendWednesdayMemeFunctionName: config.sendWednesdayMemeFunctionName,
    configureWednesdayFunctionName: config.configureWednesdayFunctionName,
  });
export const injectBotConfigurationRepository = (config: {
  region: string;
  botConfigurationTableName: string;
}) =>
  makeBotConfigurationRepository({
    dynamoDbClient: injectDynamoDbClient(config),
    botConfigurationTableName: config.botConfigurationTableName,
  });

/* Usecases */
export const injectRouteDiscordWebhookActionUsecase = (config: {
  region: string;
  sendWednesdayMemeFunctionName: string;
  configureWednesdayFunctionName: string;
}) =>
  makeRouteDiscordWebhookActionUsecase({
    botCommandRepository: injectBotCommandRepository(config),
  });

export const injectRegisterBotScheduleUsecase = (config: {
  region: string;
  discordApiUrl: string;
  discordApplicationId: string;
  discordAuthToken: string;
  botConfigurationTableName: string;
}) =>
  makeRegisterBotScheduleUsecase({
    discordApiRepository: injectDiscordApiRepository({
      discordApiUrl: config.discordApiUrl,
      applicationId: config.discordApplicationId,
      authToken: config.discordAuthToken,
    }),
    botConfigurationRepository: injectBotConfigurationRepository(config),
  });

export const injectDeleteBotRegistrationUsecase = (config: {
  region: string;
  discordApiUrl: string;
  discordApplicationId: string;
  discordAuthToken: string;
  botConfigurationTableName: string;
}) =>
  makeDeleteBotRegistrationUsecase({
    discordApiRepository: injectDiscordApiRepository({
      discordApiUrl: config.discordApiUrl,
      applicationId: config.discordApplicationId,
      authToken: config.discordAuthToken,
    }),
    botConfigurationRepository: injectBotConfigurationRepository(config),
  });

export const injectConfigureBotUsecase = (config: {
  region: string;
  discordApiUrl: string;
  discordApplicationId: string;
  discordAuthToken: string;
  botConfigurationTableName: string;
}) =>
  makeConfigureBotUsecase({
    registerBotSchedule: injectRegisterBotScheduleUsecase(config),
    deleteBotRegistration: injectDeleteBotRegistrationUsecase(config),
  });

export const injectSendWednesdayMemeUsecase = (config: {
  region: string;
  discordApiUrl: string;
  discordApplicationId: string;
  discordAuthToken: string;
  botConfigurationTableName: string;
  redditClientId: string;
  redditClientSecret: string;
  redditAuthUrl: string;
  redditApiUrl: string;
  redditUserAgent: string;
}) =>
  makeSendWednesdayMemeUsecase({
    dynamoDbClient: injectDynamoDbClient(config),
    discordApiRepository: injectDiscordApiRepository({
      discordApiUrl: config.discordApiUrl,
      applicationId: config.discordApplicationId,
      authToken: config.discordAuthToken,
    }),
    botConfigurationRepository: injectBotConfigurationRepository(config),
    redditApiRepository: injectRedditApiRepository({
      clientId: config.redditClientId,
      clientSecret: config.redditClientSecret,
      authUrl: config.redditAuthUrl,
      apiUrl: config.redditApiUrl,
      userAgent: config.redditUserAgent,
    }),
  });
