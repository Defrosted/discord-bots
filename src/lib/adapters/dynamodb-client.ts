import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

interface Deps {
  region: string;
}

export interface DynamoDbClient {
  get: <T>(TableName: string, Key: Record<string, unknown>) => Promise<T>;
  scan: <T>(TableName: string) => Promise<T[]>;
  queryAll: <T>(input: QueryCommandInput) => Promise<T[]>;
  put: <T extends Record<string, unknown>>(
    TableName: string,
    Item: T,
  ) => Promise<void>;
  delete: (TableName: string, Key: Record<string, unknown>) => Promise<void>;
}

export const makeDynamoDbClient = (deps: Deps): DynamoDbClient => {
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: deps.region,
    }),
  );

  const scan = async <T>(
    TableName: string,
    ExclusiveStartKey?: Record<string, unknown>,
  ) => {
    const { Items, LastEvaluatedKey } = await client.send(
      new ScanCommand({
        TableName,
        ExclusiveStartKey,
      }),
    );

    const result = (Items ?? []) as T[];

    if (LastEvaluatedKey)
      result.push(...(await scan<T>(TableName, LastEvaluatedKey)));

    return result;
  };

  const queryAll = async <T>(
    input: QueryCommandInput,
    ExclusiveStartKey?: Record<string, unknown>,
  ) => {
    const { Items, LastEvaluatedKey } = await client.send(
      new QueryCommand({
        ...input,
        ExclusiveStartKey,
      }),
    );

    const result = (Items ?? []) as T[];

    if (LastEvaluatedKey) {
      result.push(...(await queryAll<T>(input, LastEvaluatedKey)));
    }

    return result;
  };

  return {
    get: async <T>(TableName: string, Key: Record<string, unknown>) => {
      const result = await client.send(
        new GetCommand({
          TableName,
          Key,
        }),
      );

      return result.Item as T;
    },
    scan,
    queryAll,
    put: async (TableName, Item) => {
      await client.send(
        new PutCommand({
          TableName,
          Item,
        }),
      );
    },
    delete: async (TableName, Key) => {
      await client.send(
        new DeleteCommand({
          TableName,
          Key,
        }),
      );
    },
  };
};
