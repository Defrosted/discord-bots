import { AwsSsmAdapter } from '@adapters/AwsSsmAdapter';
import { SSMClient } from '@aws-sdk/client-ssm';
import { Config, EnvKeyArray } from './config';

export interface AppSecrets {
  reddit: {
    clientId: string;
    clientSecret: string;
  },
  discord: {
    publicKey: string;
    applicationId: string;
    token: string;
  }
}

export const getSecrets = async <T extends EnvKeyArray>(config: Config<T>): Promise<AppSecrets> => {
  const awsSsmAdapter = new AwsSsmAdapter(
    new SSMClient({ region: config.region })
  );
  const secrets = await Promise.all([
    awsSsmAdapter.getValue(config.reddit.clientId),
    awsSsmAdapter.getValue(config.reddit.clientSecret),
    awsSsmAdapter.getValue(config.discord.publicKey),
    awsSsmAdapter.getValue(config.discord.applicationId),
    awsSsmAdapter.getValue(config.discord.token)
  ]);

  if (secrets.some(secret => secret === undefined))
    throw new Error('Failed to fetch secrets from AWS SSM, check stored values');

  const [
    redditClientId,
    redditClientSecret,
    discordPublicKey,
    discordApplicationId,
    discordToken
  ] = secrets as string[];

  return {
    reddit: {
      clientId: redditClientId,
      clientSecret: redditClientSecret
    },
    discord: {
      publicKey: discordPublicKey,
      applicationId: discordApplicationId,
      token: discordToken
    }
  };
};
