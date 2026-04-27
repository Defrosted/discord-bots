import {
  LambdaClient as AwsLambdaClient,
  InvocationType,
  InvokeCommand,
} from '@aws-sdk/client-lambda';

interface Deps {
  region: string;
}

export interface LambdaClient {
  invoke: <Payload>(params: {
    FunctionName: string;
    InvocationType?: InvocationType;
    Payload: Payload;
  }) => Promise<Record<string, unknown> | void>;
}

export const makeLambdaClient = (deps: Deps): LambdaClient => {
  const client = new AwsLambdaClient({
    region: deps.region,
  });

  return {
    invoke: async ({
      FunctionName,
      InvocationType = 'RequestResponse',
      Payload,
    }) => {
      const response = await client.send(
        new InvokeCommand({
          FunctionName,
          InvocationType,
          Payload: JSON.stringify(Payload),
        }),
      );

      if (!response.Payload) return;

      const responsePayloadString = Buffer.from(response.Payload).toString();
      if (!responsePayloadString) return;

      return JSON.parse(responsePayloadString);
    },
  };
};
