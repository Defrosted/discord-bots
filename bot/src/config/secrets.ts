import { AwsSsmAdapter } from '@adapters/AwsSsmAdapter';
import { config } from '@config/.';

export interface AppSecrets {
  reddit: {
    clientId: string;
    clientSecret: string;
  },
  discord: {
    publicKey: string;
  }
}

export const getSecrets = async (): Promise<AppSecrets> => {
  const secrets = await Promise.all([
    new AwsSsmAdapter().getValue(config.reddit.clientId),
    new AwsSsmAdapter().getValue(config.reddit.clientSecret),
    new AwsSsmAdapter().getValue(config.discord.publicKey)
  ]);

  if (secrets.some(secret => secret === undefined))
    throw new Error('Failed to fetch secrets from AWS SSM, check stored values');

  const [
    redditClientId,
    redditClientSecret,
    discordPublicKey
  ] = secrets as string[];

  return {
    reddit: {
      clientId: redditClientId,
      clientSecret: redditClientSecret
    },
    discord: {
      publicKey: discordPublicKey
    }
  };
};
