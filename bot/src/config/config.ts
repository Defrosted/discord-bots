/*interface SafeEnv {
  [key: string]: string | undefined;
}*/

export interface Env {
  AWS_REGION: string;
  ACTION_LAMBDA_FUNCTIONNAME: string;
  WEDNESDAY_DYNAMODB_TABLE: string;
  REDDIT_CLIENT_ID: string;
  REDDIT_CLIENT_SECRET: string;
  BOT_DISCORD_APPLICATION_ID: string;
  BOT_DISCORD_PUBLIC_KEY: string;
  BOT_DISCORD_TOKEN: string;
}

type RequiredWithOptionalKeys<T, K extends keyof T> = Required<Omit<T, K>> & Partial<Pick<T, K>>;

const defaultOptionalKeys = [
  'ACTION_LAMBDA_FUNCTIONNAME',
  'WEDNESDAY_DYNAMODB_TABLE'
] as const;

const getEnv = (optionalKeys: readonly (keyof Env)[] = defaultOptionalKeys) => new Proxy(process.env, {
  get: (env, variable: keyof Env): string | undefined  => {
    const value = env[variable];
    if (!optionalKeys.includes(variable) && typeof value === 'undefined')
      throw new Error(`*** ENV *** Use of undefined environment variable '${variable}'`);
    
    return value;
  }
}) as RequiredWithOptionalKeys<Env, typeof optionalKeys[number]>;

export const getConfig = (optionalKeys?: readonly (keyof Env)[]) => {
  const env = getEnv(optionalKeys);
  return {
    region: env.AWS_REGION,
    actionLambdaFunctionName: env.ACTION_LAMBDA_FUNCTIONNAME,
    aws: {
      wednesdayDynamodbTableName: env.WEDNESDAY_DYNAMODB_TABLE
    },
    reddit: {
      clientId: env.REDDIT_CLIENT_ID,
      clientSecret: env.REDDIT_CLIENT_SECRET,
    },
    discord: {
      applicationId: env.BOT_DISCORD_APPLICATION_ID,
      publicKey: env.BOT_DISCORD_PUBLIC_KEY,
      token: env.BOT_DISCORD_TOKEN
    }
  };
};

export type Config = ReturnType<typeof getConfig>;
