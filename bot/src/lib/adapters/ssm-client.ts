import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

interface Deps {
  region: string;
}

export const makeSsmClient = (deps: Deps) => {
  const client = new SSMClient({
    region: deps.region,
  });

  return {
    getParameterValue: async (Name: string) => {
      const { Parameter } = await client.send(
        new GetParameterCommand({
          Name,
        }),
      );

      return Parameter?.Value;
    },
  };
};
