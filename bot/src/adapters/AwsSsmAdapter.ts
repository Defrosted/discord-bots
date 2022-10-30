import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { ExternalResourcePort } from '@ports/ExternalPort';

export class AwsSsmAdapter implements ExternalResourcePort<string> {
  constructor (private ssmClient: SSMClient) {}

  public async getValue(resourceName?: string) {
    if (!resourceName)
      throw new Error('Parameter name is required');

    const parameterResult = await this.ssmClient.send(new GetParameterCommand({
      Name: resourceName,
      WithDecryption: true
    }));

    return parameterResult.Parameter?.Value;
  }
}
