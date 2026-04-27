import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import z from 'zod';
import { WednesdayBotConfig } from '../config';
import path = require('node:path');

export const wednesdayPropsSchema = z.object({
  stage: z.string(),
});
export type WednesdayProps = StackProps & z.infer<typeof wednesdayPropsSchema>;

export class WednesdayStack extends Stack {
  constructor(scope: Construct, id: string, props: WednesdayProps) {
    super(scope, id, props);

    const discordApiUrl = new StringParameter(
      this,
      'Parameter-Discord-ApiUrl',
      {
        parameterName: '/wednesday/discord/apiUrl',
        stringValue: 'https://discord.com/api',
      },
    );
    const discordApplicationId = new Secret(this, 'Secret-Discord-AppId', {
      secretName: 'wednesday/discord/appId',
    });

    const discordAuthToken = new Secret(this, 'Secret-Discord-AuthToken', {
      secretName: 'wednesday/discord/authToken',
    });
    const discordPublicKey = new Secret(this, 'Secret-Discord-PublicKey', {
      secretName: 'wednesday/discord/publicKey',
    });

    const redditAuthUrl = new StringParameter(
      this,
      'Parameter-Reddit-AuthUrl',
      {
        parameterName: '/wednesday/reddit/authUrl',
        stringValue: 'https://www.reddit.com/api/v1/access_token',
      },
    );
    const redditApiUrl = new StringParameter(this, 'Parameter-Reddit-ApiUrl', {
      parameterName: '/wednesday/reddit/apiUrl',
      stringValue: 'https://oauth.reddit.com/r/ItIsWednesday',
    });
    const redditUserAgent = new StringParameter(
      this,
      'Parameter-Reddit-UserAgent',
      {
        parameterName: '/wednesday/reddit/userAgent',
        stringValue: `aws:wednesday-bot:v1.0.0-${props.stage} (by /u/Lambda256)`,
      },
    );
    const redditClientId = new Secret(this, 'Secret-Reddit-ClientId', {
      secretName: 'wednesday/reddit/clientId',
    });
    const redditClientSecret = new Secret(this, 'Secret-Reddit-ClientSecret', {
      secretName: 'wednesday/reddit/clientSecret',
    });

    const botConfigurationTable = new Table(this, 'Table-BotConfiguration', {
      tableName: `wednesday-bot-registrations-${props.stage}`,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'serverId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'channelId',
        type: AttributeType.STRING,
      },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    const configureWednesdayFnName = `wednesday-configure-bot-${props.stage}`;
    const sendWednesdayMemeFnName = `wednesday-send-meme-${props.stage}`;

    const functionEnv: WednesdayBotConfig = {
      region: this.region,
      discordApiUrl: discordApiUrl.stringValue,
      discordApplicationId: discordApplicationId.secretValue.toString(),
      discordAuthToken: discordAuthToken.secretValue.toString(),
      discordPublicKey: discordPublicKey.secretValue.toString(),
      botConfigurationTableName: botConfigurationTable.tableName,
      redditClientId: redditClientId.secretValue.toString(),
      redditClientSecret: redditClientSecret.secretValue.toString(),
      redditAuthUrl: redditAuthUrl.stringValue,
      redditApiUrl: redditApiUrl.stringValue,
      redditUserAgent: redditUserAgent.stringValue,
      configureWednesdayFnName,
      sendWednesdayMemeFnName,
    };

    const configureWednesdayBotFunction = new NodejsFunction(
      this,
      'Function-ConfigureBot',
      {
        functionName: configureWednesdayFnName,
        runtime: Runtime.NODEJS_22_X,
        environment: functionEnv,
        memorySize: 512,
        entry: path.join(__dirname, '../entrypoints/events/configure-bot.ts'),
        description: new Date().toISOString(), // Refresh on every deployment
      },
    );
    botConfigurationTable.grantReadWriteData(configureWednesdayBotFunction);

    const sendWednesdayMemeFunction = new NodejsFunction(
      this,
      'Function-SendWednesdayMeme',
      {
        functionName: `wednesday-send-meme-${props.stage}`,
        runtime: Runtime.NODEJS_22_X,
        environment: functionEnv,
        memorySize: 512,
        entry: path.join(
          __dirname,
          '../entrypoints/events/send-wednesday-meme.ts',
        ),
        description: new Date().toISOString(), // Refresh on every deployment
      },
    );
    botConfigurationTable.grantReadData(sendWednesdayMemeFunction);

    new Rule(this, 'Rule-SendWednesdayMemeCron', {
      schedule: Schedule.expression('cron(0 0 ? * WED *)'),
      targets: [new LambdaFunction(sendWednesdayMemeFunction)],
    });

    const routeDiscordWebHookFunction = new NodejsFunction(
      this,
      'Function-RouteDiscordWebhookAction',
      {
        functionName: `wednesday-route-discord-webhook-action-${props.stage}`,
        runtime: Runtime.NODEJS_22_X,
        memorySize: 1024,
        environment: functionEnv,
        entry: path.join(
          __dirname,
          '../entrypoints/rest/route-discord-webhook-action.ts',
        ),
        description: new Date().toISOString(), // Refresh on every deployment
      },
    );
    sendWednesdayMemeFunction.grantInvoke(routeDiscordWebHookFunction);
    configureWednesdayBotFunction.grantInvoke(routeDiscordWebHookFunction);

    const api = new RestApi(this, 'API-WednesdayBot', {
      restApiName: `wednesday-bot-api-${props.stage}`,
      cloudWatchRole: true,
      deploy: true,
    });
    const discordRoute = api.root.addResource('discord');
    discordRoute.addMethod(
      'POST',
      new LambdaIntegration(routeDiscordWebHookFunction, { proxy: true }),
    );
  }
}
