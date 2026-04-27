import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { makeLambdaClient } from './lambda-client';

const mockSend = vi.fn();
vi.spyOn(LambdaClient.prototype, 'send').mockImplementation(mockSend);

describe('makeLambdaClient', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('invoke', () => {
    test('serializes Payload as a JSON string', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeLambdaClient({ region: 'eu-west-1' });
      const payload = { serverId: 's1', channelId: 'c1', token: 'tok' };

      await client.invoke({ FunctionName: 'my-fn', Payload: payload });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ Payload: JSON.stringify(payload) }) }),
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

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ InvocationType: 'RequestResponse' }) }),
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

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ InvocationType: 'Event' }) }),
      );
    });

    test('passes FunctionName to InvokeCommand', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeLambdaClient({ region: 'eu-west-1' });

      await client.invoke({ FunctionName: 'my-specific-fn', Payload: {} });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ FunctionName: 'my-specific-fn' }) }),
      );
    });
  });
});
