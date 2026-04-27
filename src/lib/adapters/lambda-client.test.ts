import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn());

vi.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: vi.fn().mockImplementation(() => ({ send: mockSend })),
  InvokeCommand: vi.fn().mockImplementation((input) => input),
  InvocationType: { Event: 'Event', RequestResponse: 'RequestResponse' },
}));

import { InvokeCommand } from '@aws-sdk/client-lambda';
import { makeLambdaClient } from './lambda-client';

describe('makeLambdaClient', () => {
  beforeEach(() => {
    mockSend.mockReset();
    vi.mocked(InvokeCommand).mockClear();
  });

  describe('invoke', () => {
    test('serializes Payload as a JSON string', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeLambdaClient({ region: 'eu-west-1' });
      const payload = { serverId: 's1', channelId: 'c1', token: 'tok' };

      await client.invoke({ FunctionName: 'my-fn', Payload: payload });

      expect(vi.mocked(InvokeCommand)).toHaveBeenCalledWith(
        expect.objectContaining({ Payload: JSON.stringify(payload) }),
      );
    });

    test('returns undefined when response has no Payload', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeLambdaClient({ region: 'eu-west-1' });

      const result = await client.invoke({ FunctionName: 'my-fn', Payload: {} });

      expect(result).toBeUndefined();
    });

    test('parses and returns the response Payload when present', async () => {
      const responseData = { statusCode: 200, body: 'ok' };
      mockSend.mockResolvedValueOnce({
        Payload: Buffer.from(JSON.stringify(responseData)),
      });
      const client = makeLambdaClient({ region: 'eu-west-1' });

      const result = await client.invoke({ FunctionName: 'my-fn', Payload: {} });

      expect(result).toEqual(responseData);
    });

    test('defaults InvocationType to RequestResponse', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeLambdaClient({ region: 'eu-west-1' });

      await client.invoke({ FunctionName: 'my-fn', Payload: {} });

      expect(vi.mocked(InvokeCommand)).toHaveBeenCalledWith(
        expect.objectContaining({ InvocationType: 'RequestResponse' }),
      );
    });

    test('uses provided InvocationType', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeLambdaClient({ region: 'eu-west-1' });

      await client.invoke({
        FunctionName: 'my-fn',
        Payload: {},
        InvocationType: 'Event' as never,
      });

      expect(vi.mocked(InvokeCommand)).toHaveBeenCalledWith(
        expect.objectContaining({ InvocationType: 'Event' }),
      );
    });

    test('passes FunctionName to InvokeCommand', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeLambdaClient({ region: 'eu-west-1' });

      await client.invoke({ FunctionName: 'my-specific-fn', Payload: {} });

      expect(vi.mocked(InvokeCommand)).toHaveBeenCalledWith(
        expect.objectContaining({ FunctionName: 'my-specific-fn' }),
      );
    });
  });
});
