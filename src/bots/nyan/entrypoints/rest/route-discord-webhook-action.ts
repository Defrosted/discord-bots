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
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import * as R from 'ramda';
import { getConfig } from '../../config';
import { injectRouteDiscordWebhookActionUsecase } from '../../di';
import { RouteDiscordWebhookActionUsecase } from '../../usecases/route-discord-webhook-action';

interface Deps {
  verifyEventSignature: VerifyApiGwEventDiscordSignature;
  routeDiscordWebhookAction: RouteDiscordWebhookActionUsecase;
}

const validateParams = (params: RequestParams) =>
  makeRecordValidator(routeDiscordWebhookRequestSchema)(params.body);

export const makeHandler = (deps: Deps) =>
  makeApiGatewayProxyHandler((event: APIGatewayProxyEventV2) => {
    deps.verifyEventSignature(event);

    return R.pipe(
      parseApiGwEvent,
      validateParams,
      deps.routeDiscordWebhookAction,
      toSuccessResponse,
    )(event);
  });

const config = getConfig();
export const handler = makeHandler({
  verifyEventSignature: injectVerifyApiGwEventDiscordSignature(config),
  routeDiscordWebhookAction: injectRouteDiscordWebhookActionUsecase(config),
});
