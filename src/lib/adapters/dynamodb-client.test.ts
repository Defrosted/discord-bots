import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { makeDynamoDbClient } from './dynamodb-client';

const mockSend = vi.fn();
vi.spyOn(DynamoDBDocumentClient.prototype, 'send').mockImplementation(mockSend);

describe('makeDynamoDbClient', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('scan', () => {
    test('returns all items from a single page', async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ id: '1' }, { id: '2' }] });
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      const result = await client.scan('test-table');

      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test('returns empty array when table has no items', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      const result = await client.scan('test-table');

      expect(result).toEqual([]);
    });

    test('paginates across two pages when LastEvaluatedKey is present', async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [{ id: '1' }], LastEvaluatedKey: { id: '1' } })
        .mockResolvedValueOnce({ Items: [{ id: '2' }] });
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      const result = await client.scan('test-table');

      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    test('paginates across three pages', async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [{ id: '1' }], LastEvaluatedKey: { id: '1' } })
        .mockResolvedValueOnce({ Items: [{ id: '2' }], LastEvaluatedKey: { id: '2' } })
        .mockResolvedValueOnce({ Items: [{ id: '3' }] });
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      const result = await client.scan('test-table');

      expect(result).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('queryAll', () => {
    test('returns items from a single page', async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ pk: 'a' }] });
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      const result = await client.queryAll({
        TableName: 'test-table',
        KeyConditionExpression: 'pk = :v',
      });

      expect(result).toEqual([{ pk: 'a' }]);
    });

    test('paginates when LastEvaluatedKey is present', async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [{ pk: 'a' }], LastEvaluatedKey: { pk: 'a' } })
        .mockResolvedValueOnce({ Items: [{ pk: 'b' }] });
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      const result = await client.queryAll({
        TableName: 'test-table',
        KeyConditionExpression: 'pk = :v',
      });

      expect(result).toEqual([{ pk: 'a' }, { pk: 'b' }]);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('get', () => {
    test('returns the Item from the response', async () => {
      mockSend.mockResolvedValueOnce({ Item: { id: '1', name: 'Alice' } });
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      const result = await client.get('test-table', { id: '1' });

      expect(result).toEqual({ id: '1', name: 'Alice' });
    });
  });

  describe('put', () => {
    test('sends exactly one command to DynamoDB', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      await client.put('test-table', { id: '1', name: 'Alice' });

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    test('sends exactly one command to DynamoDB', async () => {
      mockSend.mockResolvedValueOnce({});
      const client = makeDynamoDbClient({ region: 'eu-west-1' });

      await client.delete('test-table', { id: '1' });

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
