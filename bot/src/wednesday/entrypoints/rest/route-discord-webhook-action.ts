import { injectVerifyApiGwEventDiscordSignature } from '@lib/di';
import { routeDiscordWebhookRequestSchema } from '@lib/schemas/rest-api/discord';
import {
  RequestParams,
  makeApiGatewayProxyHandler,
  parseApiGwEvent,
  toSuccessResponse,
} from '@lib/util/apigateway';
import { VerifyApiGwEventDiscordSignature } from '@lib/util/discord-signature';
import { makeRecordValidator } from '@lib/util/record-validator';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as R from 'ramda';
import { Config } from 'sst/node/config';
import { Function } from 'sst/node/function';
import { injectRouteDiscordWebhookActionUsecase } from '../../di';
import { RouteDiscordWebhookActionUsecase } from '../../usecases/route-discord-webhook-action';

interface Deps {
  verifyEventSignature: VerifyApiGwEventDiscordSignature;
  routeDiscordWebhookAction: RouteDiscordWebhookActionUsecase;
}

const validateParams = (params: RequestParams) =>
  makeRecordValidator(routeDiscordWebhookRequestSchema)(params.body);

export const makeHandler = (deps: Deps) =>
  makeApiGatewayProxyHandler((event: APIGatewayProxyEvent) => {
    deps.verifyEventSignature(event);

    return R.pipe(
      parseApiGwEvent,
      validateParams,
      deps.routeDiscordWebhookAction,
      toSuccessResponse,
    )(event);
  });

const getConfig = () => ({
  region: Config.REGION,
  discordApiUrl: Config.DISCORD_API_URL,
  discordPublicKey: Config.DISCORD_PUBLIC_KEY,
  sendWednesdayMemeFunctionName:
    Function.SendWednesdayMemeFunction.functionName,
  configureWednesdayFunctionName: Function.ConfigureBotFunction.functionName,
});

export const handler = makeHandler({
  verifyEventSignature: injectVerifyApiGwEventDiscordSignature(getConfig()),
  routeDiscordWebhookAction:
    injectRouteDiscordWebhookActionUsecase(getConfig()),
});
