import { ExternalResourcePort } from '@ports/ExternalResourcePort';
import * as AWS from 'aws-sdk';

export class AwsSsmAdapter implements ExternalResourcePort<string | undefined> {
  constructor (private manager: AWS.SSM = new AWS.SSM()) {}

  public async getValue(resourceName?: string) {
    if (!resourceName)
      throw new Error('Parameter name is required');

    const parameterResult = await this.manager.getParameter({
      Name: resourceName,
      WithDecryption: true
    }).promise();

    return parameterResult.Parameter?.Value;
  }
}
