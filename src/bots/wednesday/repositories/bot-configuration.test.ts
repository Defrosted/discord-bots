import { describe, expect, test, vi } from 'vitest';
import { BotConfiguration } from '../domain/bot-configuration';
import { makeBotConfigurationRepository } from './bot-configuration';

const TABLE_NAME = 'bot-config-table';

const makeDynamoDbClient = () => ({
  get: vi.fn(),
  scan: vi.fn().mockResolvedValue([]),
  queryAll: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('makeBotConfigurationRepository', () => {
  describe('getAll', () => {
    test('scans the configured DynamoDB table', async () => {
      const dynamoDbClient = makeDynamoDbClient();
      const repo = makeBotConfigurationRepository({ botConfigurationTableName: TABLE_NAME, dynamoDbClient });

      await repo.getAll();

      expect(dynamoDbClient.scan).toHaveBeenCalledWith(TABLE_NAME);
    });

    test('maps scan results to BotConfiguration instances', async () => {
      const dynamoDbClient = makeDynamoDbClient();
      dynamoDbClient.scan.mockResolvedValue([
        { serverId: 's1', channelId: 'c1' },
        { serverId: 's2', channelId: 'c2' },
      ]);
      const repo = makeBotConfigurationRepository({ botConfigurationTableName: TABLE_NAME, dynamoDbClient });

      const result = await repo.getAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(BotConfiguration);
      expect(result[0].serverId).toBe('s1');
      expect(result[1].channelId).toBe('c2');
    });

    test('returns an empty array when the table has no items', async () => {
      const dynamoDbClient = makeDynamoDbClient();
      const repo = makeBotConfigurationRepository({ botConfigurationTableName: TABLE_NAME, dynamoDbClient });

      const result = await repo.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('put', () => {
    test('puts the configuration in the correct table', async () => {
      const dynamoDbClient = makeDynamoDbClient();
      const repo = makeBotConfigurationRepository({ botConfigurationTableName: TABLE_NAME, dynamoDbClient });
      const config = new BotConfiguration({ serverId: 's1', channelId: 'c1' });

      await repo.put(config);

      expect(dynamoDbClient.put).toHaveBeenCalledWith(TABLE_NAME, { serverId: 's1', channelId: 'c1' });
    });
  });

  describe('delete', () => {
    test('deletes using serverId and channelId as the key', async () => {
      const dynamoDbClient = makeDynamoDbClient();
      const repo = makeBotConfigurationRepository({ botConfigurationTableName: TABLE_NAME, dynamoDbClient });

      await repo.delete({ serverId: 's1', channelId: 'c1' });

      expect(dynamoDbClient.delete).toHaveBeenCalledWith(TABLE_NAME, {
        serverId: 's1',
        channelId: 'c1',
      });
    });
  });
});
