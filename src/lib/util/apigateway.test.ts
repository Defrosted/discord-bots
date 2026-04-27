import { describe, expect, test } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import {
  makeApiGatewayProxyHandler,
  parseApiGwBody,
  parseApiGwEvent,
  toSuccessResponse,
} from './apigateway';

const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}) =>
  ({
    version: '2.0',
    routeKey: 'POST /webhook',
    rawPath: '/webhook',
    rawQueryString: '',
    headers: {},
    requestContext: {},
    isBase64Encoded: false,
    ...overrides,
  }) as unknown as APIGatewayProxyEventV2;

describe('parseApiGwBody', () => {
  test('returns body as-is when not base64 encoded', () => {
    const event = makeEvent({ body: '{"foo":"bar"}', isBase64Encoded: false });
    expect(parseApiGwBody(event)).toBe('{"foo":"bar"}');
  });

  test('decodes base64-encoded body', () => {
    const encoded = Buffer.from('{"foo":"bar"}').toString('base64');
    const event = makeEvent({ body: encoded, isBase64Encoded: true });
    expect(parseApiGwBody(event)).toBe('{"foo":"bar"}');
  });

  test('returns undefined when body is absent', () => {
    expect(parseApiGwBody(makeEvent({ body: undefined }))).toBeUndefined();
  });

  test('returns undefined when body is absent and isBase64Encoded is true', () => {
    expect(parseApiGwBody(makeEvent({ body: undefined, isBase64Encoded: true }))).toBeUndefined();
  });
});

describe('parseApiGwEvent', () => {
  test('parses JSON body', () => {
    const result = parseApiGwEvent(makeEvent({ body: '{"key":"value"}' }));
    expect(result.body).toEqual({ key: 'value' });
  });

  test('includes path parameters', () => {
    const result = parseApiGwEvent(makeEvent({ pathParameters: { id: '123' } }));
    expect(result.path).toEqual({ id: '123' });
  });

  test('includes query string parameters', () => {
    const result = parseApiGwEvent(makeEvent({ queryStringParameters: { page: '1' } }));
    expect(result.query).toEqual({ page: '1' });
  });

  test('returns undefined body when no body present', () => {
    const result = parseApiGwEvent(makeEvent({}));
    expect(result.body).toBeUndefined();
  });

  test('returns undefined path when no pathParameters', () => {
    const result = parseApiGwEvent(makeEvent({}));
    expect(result.path).toBeUndefined();
  });
});

describe('toSuccessResponse', () => {
  test('returns 200 status with JSON body', async () => {
    const result = await toSuccessResponse(Promise.resolve({ foo: 'bar' }));
    expect(result).toMatchObject({
      statusCode: 200,
      isBase64Encoded: false,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });
  });

  test('serializes null data as "null" in body', async () => {
    const result = await toSuccessResponse(Promise.resolve(null));
    expect(result).toMatchObject({ statusCode: 200, body: 'null' });
  });
});

describe('makeApiGatewayProxyHandler', () => {
  test('returns the handler result on success', async () => {
    const handler = makeApiGatewayProxyHandler(async () => ({
      statusCode: 200,
      body: 'ok',
    }));
    const result = await handler(makeEvent());
    expect(result).toEqual({ statusCode: 200, body: 'ok' });
  });

  test('maps BotError to the correct HTTP status code', async () => {
    const handler = makeApiGatewayProxyHandler(async () => {
      throw new BotError(BotErrorType.InvalidSignatureError);
    });
    const result = await handler(makeEvent());
    expect(result).toMatchObject({ statusCode: 401 });
  });

  test('includes responseDetails in the body when BotError has them', async () => {
    const responseDetails = { reason: 'missing field' };
    const handler = makeApiGatewayProxyHandler(async () => {
      throw new BotError(BotErrorType.InvalidInputError, { responseDetails });
    });
    const result = await handler(makeEvent());
    expect(result).toMatchObject({
      statusCode: 400,
      body: JSON.stringify(responseDetails),
    });
  });

  test('returns 500 for unknown errors', async () => {
    const handler = makeApiGatewayProxyHandler(async () => {
      throw new Error('unexpected');
    });
    const result = await handler(makeEvent());
    expect(result).toMatchObject({ statusCode: 500 });
  });
});
