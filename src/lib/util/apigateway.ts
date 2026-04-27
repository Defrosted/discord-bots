import { BotError } from '@lib/errors/bot-error';
import logger from '@lib/util/logger';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export interface RequestParams {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export const parseApiGwBody = (event: APIGatewayProxyEventV2) =>
  event.isBase64Encoded && event.body
    ? Buffer.from(event.body, 'base64').toString()
    : (event.body ?? undefined);

export const parseApiGwEvent = (
  event: APIGatewayProxyEventV2,
): RequestParams => {
  const stringBody = parseApiGwBody(event);

  return {
    path: event.pathParameters ?? undefined,
    query: event.queryStringParameters ?? undefined,
    body: stringBody
      ? (JSON.parse(stringBody) as Record<string, unknown>)
      : undefined,
  };
};

export const toSuccessResponse = async (
  data: Promise<unknown>,
): Promise<APIGatewayProxyResultV2> => {
  const response = {
    statusCode: 200,
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(await data) : '',
  };
  logger.info('Sending success response', response);
  return response;
};

export const makeApiGatewayProxyHandler =
  (
    handler: (
      event: APIGatewayProxyEventV2,
    ) => Promise<APIGatewayProxyResultV2>,
  ) =>
  async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
      return await handler(event);
    } catch (error) {
      logger.error('Failed to execute handler', { error });

      if (error instanceof BotError) {
        return {
          statusCode: error.getStatusCode(),
          body: error.responseDetails
            ? JSON.stringify(error.responseDetails)
            : undefined,
        };
      }

      return {
        statusCode: 500,
      };
    }
  };
