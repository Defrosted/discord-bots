interface SafeEnv {
  [key: string]: string | undefined;
}

const optionalKeys = [
  'ACTION_LAMBDA_FUNCTIONNAME'
];
const env = new Proxy(process.env, {
  get: (env, variable: string): string | undefined  => {
    const value = env[variable];
    if (!optionalKeys.includes(variable) && typeof value === 'undefined')
      throw new Error('*** ENV *** Use onf undefined environment variable');
    
    return value;
  }
}) as SafeEnv;

export const config = {
  region: env.AWS_REGION,
  actionLambdaFunctionName: env.ACTION_LAMBDA_FUNCTIONNAME,
  reddit: {
    clientId: env.REDDIT_CLIENT_ID,
    clientSecret: env.REDDIT_CLIENT_SECRET,
  },
  discord: {
    applicationId: env.BOT_DISCORD_APPLICATION_ID,
    publicKey: env.BOT_DISCORD_PUBLIC_KEY
  }
};
