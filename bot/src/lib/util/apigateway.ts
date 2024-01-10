import { BotError } from '@lib/errors/bot-error';
import {
  APIGatewayEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import * as log from 'lambda-log';

export interface RequestParams {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export const parseApiGwBody = (event: APIGatewayEvent) =>
  event.isBase64Encoded && event.body
    ? Buffer.from(event.body, 'base64').toString()
    : event.body ?? undefined;

export const parseApiGwEvent = (event: APIGatewayEvent): RequestParams => {
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
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(await data) : '',
  };
};

export const makeApiGatewayProxyHandler =
  (
    handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResultV2>,
  ) =>
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
    try {
      return await handler(event);
    } catch (error) {
      log.error('Failed to execute handler', { error });

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
