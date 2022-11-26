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

const defaultOptionalKeys = [
  'ACTION_LAMBDA_FUNCTIONNAME',
  'WEDNESDAY_DYNAMODB_TABLE'
] as const;

export type EnvKeyArray = readonly (keyof Env)[];
type RequiredWithOptionalKeys<K extends EnvKeyArray> = {
  [P in keyof Env]: P extends K[number]
    ? string | undefined
    : string
};


const getEnv = <T extends EnvKeyArray>(
  optionalKeys: readonly (keyof Env)[] = defaultOptionalKeys
): RequiredWithOptionalKeys<T> => new Proxy(process.env as unknown as Env, {
  get: (env, variable: keyof Env): string | undefined  => {
    const value = env[variable];
    if (!optionalKeys.includes(variable) && typeof value === 'undefined')
      throw new Error(`*** ENV *** Use of undefined environment variable '${variable}'`);
    
    return value;
  }
});

export const getConfig = <T extends EnvKeyArray>(optionalKeys?: T): Config<T> => {
  const env = getEnv<T>(optionalKeys);
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

export type Config<T extends EnvKeyArray = typeof defaultOptionalKeys> = {
  region: RequiredWithOptionalKeys<T>['AWS_REGION'],
  actionLambdaFunctionName: RequiredWithOptionalKeys<T>['ACTION_LAMBDA_FUNCTIONNAME'],
  aws: {
    wednesdayDynamodbTableName: RequiredWithOptionalKeys<T>['WEDNESDAY_DYNAMODB_TABLE']
  },
  reddit: {
    clientId: RequiredWithOptionalKeys<T>['REDDIT_CLIENT_ID']
    clientSecret: RequiredWithOptionalKeys<T>['REDDIT_CLIENT_SECRET']
  },
  discord: {
    applicationId: RequiredWithOptionalKeys<T>['BOT_DISCORD_APPLICATION_ID'],
    publicKey: RequiredWithOptionalKeys<T>['BOT_DISCORD_PUBLIC_KEY'],
    token: RequiredWithOptionalKeys<T>['BOT_DISCORD_TOKEN']
  }
}
