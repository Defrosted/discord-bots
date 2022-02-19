import * as cdk from 'aws-cdk-lib';
import { BotStack } from '../lib/bot-stack';

export class Environment {
  public static readonly PRODUCTION = 'production';
}

const accounts = {
  'production': {
    account: '416274145411',
    region: 'eu-north-1'
  }
};

try {
  const app = new cdk.App();
  const env = process.env.CDK_ENVIRONMENT;
  console.log(env);

  switch(env) {
    case Environment.PRODUCTION:
      new BotStack(app, 'BotStackProduction', {
        env: accounts[Environment.PRODUCTION],
        tags: {
          'Application': 'wednesday-bot',
          'Environment': Environment.PRODUCTION
        }
      }, {
        environmentName: Environment.PRODUCTION
      });
      break;
    default:
      throw new Error(`No environment configuration found for '${env}'`);
  }

  app.synth();
} catch(error) {
  console.error(error);
}
