interface SafeEnv {
  [key: string]: string;
}

const env = new Proxy(process.env, {
  get: (env, variable: string): string => {
    const value = env[variable];
    if (typeof value === 'undefined')
      throw new Error('*** ENV *** Use onf undefined environment variable');
    
    return value;
  }
}) as SafeEnv;

export const config = {
  reddit: {
    clientId: env.REDDIT_CLIENT_ID,
    clientSecret: env.REDDIT_CLIENT_SECRET,
  },
  discord: {
    publicKey: env.BOT_DISCORD_PUBLIC_KEY
  }
};
