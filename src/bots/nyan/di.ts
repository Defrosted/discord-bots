import {
  injectCataasApiRepository,
  injectDiscordApiRepository,
  injectLambdaClient,
} from '@lib/di';
import { makeBotCommandRepository } from './repositories/bot-command';
import { makeRouteDiscordWebhookActionUsecase } from './usecases/route-discord-webhook-action';
import { makeSendCatPhotoUsecase } from './usecases/send-cat-photo';

/* Repositories */
export const injectBotCommandRepository = (config: {
  region: string;
  sendCatPhotoFnName: string;
}) =>
  makeBotCommandRepository({
    lambdaClient: injectLambdaClient(config),
    sendCatPhotoFunctionName: config.sendCatPhotoFnName,
  });

/* Usecases */
export const injectRouteDiscordWebhookActionUsecase = (config: {
  region: string;
  sendCatPhotoFnName: string;
}) =>
  makeRouteDiscordWebhookActionUsecase({
    botCommandRepository: injectBotCommandRepository(config),
  });

export const injectSendCatPhotoUsecase = (config: {
  discordApiUrl: string;
  discordApplicationId: string;
  discordAuthToken: string;
  cataasApiUrl: string;
}) =>
  makeSendCatPhotoUsecase({
    discordApiRepository: injectDiscordApiRepository({
      discordApiUrl: config.discordApiUrl,
      applicationId: config.discordApplicationId,
      authToken: config.discordAuthToken,
    }),
    cataasApiRepository: injectCataasApiRepository({
      cataasApiUrl: config.cataasApiUrl,
    }),
  });
