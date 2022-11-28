import { AwsSsmAdapter } from '@adapters/AwsSsmAdapter';
import { SSMClient } from '@aws-sdk/client-ssm';
import { getConfig } from '.';
import { Config, defaultOptionalKeys, EnvKeyArray } from './config';

const awsSsmAdapter = new AwsSsmAdapter(
  new SSMClient({ region: getConfig(defaultOptionalKeys).region })
);

export const getSecrets = <T extends EnvKeyArray>(config: Config<T>) => {
  const secretBase = {
    redditClientId: config.reddit.clientId as string | undefined,
    redditClientSecret: config.reddit.clientSecret as string | undefined,
    discordPublicKey: config.discord.publicKey as string | undefined,
    discordApplicationId: config.discord.applicationId as string | undefined,
    discordToken: config.discord.token as string | undefined
  };

  type SecretKeys = keyof typeof secretBase
  type Secret = {
    [key in `${SecretKeys}_resolved`]?: Promise<string>;
  } & {
    [key in SecretKeys]?: string;
  }

  return new Proxy(secretBase, {
    get(target: Secret, prop: string): Promise<string> {
      const key = prop as keyof typeof target;
      const value = target[key];

      if(!value)
        throw new Error(`Config value for secret key '${prop}' is undefined`);
      if(value instanceof Promise)
        return value;
      
      const resolvedValue = target[`${key as SecretKeys}_resolved`];
      if(resolvedValue)
        return resolvedValue;

      const ssmPromise = awsSsmAdapter.getValue(value)
        .then(value => {
          if(!value)
            throw new Error(`SSM Parameter value for '${prop}' was undefined`);
          return value;
        });
      target[`${key as SecretKeys}_resolved`] = ssmPromise;
      return ssmPromise;
    }
  }) as unknown as { [key in SecretKeys]: Promise<string> };
};
