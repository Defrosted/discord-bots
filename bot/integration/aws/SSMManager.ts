import * as AWS from 'aws-sdk';

export class SSMManager {
  private manager: AWS.SSM;
  private parameter?: AWS.SSM.Parameter;

  constructor ();
  constructor (manager?: AWS.SSM) {
    this.manager = manager ?? new AWS.SSM();
  }

  public retrieveParameter = async (Name?: string): Promise<void> => {
    if(!Name)
      throw new Error('Parameter name is required');

    this.parameter = (
      await this.manager.getParameter({
        Name,
        WithDecryption: true
      }).promise()
    ).Parameter;
  };

  public getParameterValue = async (Name?: string): Promise<string | undefined> => {
    await this.retrieveParameter(Name);

    return this.parameter?.Value;
  };
}