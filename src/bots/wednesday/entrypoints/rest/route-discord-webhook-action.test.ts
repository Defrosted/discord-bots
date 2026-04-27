import { describe, expect, test, vi } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { DiscordInteractionType } from '@lib/constants';
import { DiscordInteractionReplyType } from '@lib/domain/discord-webhook-interaction';
import { BotError, BotErrorType } from '@lib/errors/bot-error';

vi.mock('../../config', () => ({ getConfig: vi.fn().mockReturnValue({}) }));
vi.mock('../../di', () => ({
  injectRouteDiscordWebhookActionUsecase: vi.fn().mockReturnValue(vi.fn()),
}));
vi.mock('@lib/di', () => ({
  injectVerifyApiGwEventDiscordSignature: vi.fn().mockReturnValue(vi.fn()),
}));

import { makeHandler } from './route-discord-webhook-action';

const makeEvent = (body: unknown): APIGatewayProxyEventV2 =>
  ({
    version: '2.0',
    routeKey: 'POST /webhook',
    rawPath: '/webhook',
    rawQueryString: '',
    headers: {},
    requestContext: {},
    isBase64Encoded: false,
    body: JSON.stringify(body),
  }) as unknown as APIGatewayProxyEventV2;

const makeValidInteraction = () => ({
  id: '1',
  type: DiscordInteractionType.PING,
  token: 'tok',
});

const makePongReply = () => ({ type: DiscordInteractionReplyType.PONG });

describe('REST route-discord-webhook-action handler', () => {
  test('returns 200 when signature is valid and usecase succeeds', async () => {
    const verifyEventSignature = vi.fn();
    const routeDiscordWebhookAction = vi.fn().mockResolvedValue(makePongReply());
    const handler = makeHandler({ verifyEventSignature, routeDiscordWebhookAction });

    const result = await handler(makeEvent(makeValidInteraction()));

    expect(result).toMatchObject({ statusCode: 200 });
  });

  test('calls routeDiscordWebhookAction with the validated interaction', async () => {
    const verifyEventSignature = vi.fn();
    const routeDiscordWebhookAction = vi.fn().mockResolvedValue(makePongReply());
    const handler = makeHandler({ verifyEventSignature, routeDiscordWebhookAction });

    await handler(makeEvent(makeValidInteraction()));

    expect(routeDiscordWebhookAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: DiscordInteractionType.PING }),
    );
  });

  test('returns 401 when signature verification throws InvalidSignatureError', async () => {
    const verifyEventSignature = vi.fn().mockImplementation(() => {
      throw new BotError(BotErrorType.InvalidSignatureError);
    });
    const routeDiscordWebhookAction = vi.fn();
    const handler = makeHandler({ verifyEventSignature, routeDiscordWebhookAction });

    const result = await handler(makeEvent(makeValidInteraction()));

    expect(result).toMatchObject({ statusCode: 401 });
    expect(routeDiscordWebhookAction).not.toHaveBeenCalled();
  });

  test('returns 400 when request body fails schema validation', async () => {
    const verifyEventSignature = vi.fn();
    const routeDiscordWebhookAction = vi.fn();
    const handler = makeHandler({ verifyEventSignature, routeDiscordWebhookAction });

    const result = await handler(makeEvent({ missing: 'required fields' }));

    expect(result).toMatchObject({ statusCode: 400 });
    expect(routeDiscordWebhookAction).not.toHaveBeenCalled();
  });

  test('returns 404 when usecase throws CommandNotFoundError', async () => {
    const verifyEventSignature = vi.fn();
    const routeDiscordWebhookAction = vi.fn().mockRejectedValue(
      new BotError(BotErrorType.CommandNotFoundError),
    );
    const handler = makeHandler({ verifyEventSignature, routeDiscordWebhookAction });

    const result = await handler(makeEvent(makeValidInteraction()));

    expect(result).toMatchObject({ statusCode: 404 });
  });

  test('returns 500 for unexpected errors from the usecase', async () => {
    const verifyEventSignature = vi.fn();
    const routeDiscordWebhookAction = vi.fn().mockRejectedValue(new Error('unexpected'));
    const handler = makeHandler({ verifyEventSignature, routeDiscordWebhookAction });

    const result = await handler(makeEvent(makeValidInteraction()));

    expect(result).toMatchObject({ statusCode: 500 });
  });
});
