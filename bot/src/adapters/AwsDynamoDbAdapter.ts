import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ExternalResourcePort } from '@ports/ExternalPort';

interface DynamoDBKeyParameter {
  primaryKeyName: string;
  primaryKeyValue: unknown;
  sortKeyName?: string;
  sortKeyValue?: unknown;
}

type ItemOrKey = 'Key' | 'Item';
export class AwsDynamoDbAdapter<ResultType>
  implements ExternalResourcePort<ResultType, DynamoDBKeyParameter>
{
  private docClient: DynamoDBDocumentClient;

  constructor(
    private dynamoDbClient: DynamoDBClient,
    private tableName: string
  ) {
    this.docClient = DynamoDBDocumentClient.from(this.dynamoDbClient);
  }

  private mapParametersToInput(
    keyName: ItemOrKey,
    {
      primaryKeyName,
      primaryKeyValue,
      sortKeyName,
      sortKeyValue,
    }: DynamoDBKeyParameter
  ) {
    const input: Record<string, unknown> = {
      [primaryKeyName]: primaryKeyValue,
    };
    if (sortKeyName) input[sortKeyName] = sortKeyValue;

    return {
      TableName: this.tableName,
      [keyName]: input,
    };
  }

  public async getValue(
    params: DynamoDBKeyParameter
  ): Promise<ResultType | undefined> {
    const document = await this.docClient.send(
      new GetCommand(
        this.mapParametersToInput('Key', params) as unknown as GetCommandInput
      )
    );

    return document.Item as ResultType | undefined;
  }

  public async getAllValues(): Promise<ResultType[] | undefined> {
    const result = await this.docClient.send(new ScanCommand({
      TableName: this.tableName
    }));

    return result.Items as ResultType[] | undefined;
  }

  public async putValue(
    params: DynamoDBKeyParameter
  ): Promise<ResultType | undefined> {
    const document = await this.docClient.send(
      new PutCommand(
        this.mapParametersToInput('Item', params) as unknown as PutCommandInput
      )
    );

    return document.Attributes as ResultType | undefined;
  }

  public async deleteValue(
    params: DynamoDBKeyParameter
  ): Promise<ResultType | undefined> {
    const document = await this.docClient.send(
      new DeleteCommand(
        this.mapParametersToInput(
          'Key',
          params
        ) as unknown as DeleteCommandInput
      )
    );

    return document.Attributes as ResultType | undefined;
  }
}
