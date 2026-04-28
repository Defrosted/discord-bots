import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import z from 'zod';
import { NyanBotConfig } from '../config';
import path = require('node:path');

export const nyanPropsSchema = z.object({
  stage: z.string(),
});
export type NyanProps = StackProps & z.infer<typeof nyanPropsSchema>;

export class NyanStack extends Stack {
  constructor(scope: Construct, id: string, props: NyanProps) {
    super(scope, id, props);

    const discordApiUrl = new StringParameter(
      this,
      'Parameter-Discord-ApiUrl',
      {
        parameterName: '/nyan/discord/apiUrl',
        stringValue: 'https://discord.com/api',
      },
    );
    const discordCredentials = Secret.fromSecretNameV2(
      this,
      'Secret-Discord-Credentials',
      'nyan/discord',
    );

    const cataasApiUrl = new StringParameter(this, 'Parameter-Cataas-ApiUrl', {
      parameterName: '/nyan/cataas/apiUrl',
      stringValue: 'https://cataas.com',
    });

    const sendCatPhotoFnName = `nyan-send-cat-photo-${props.stage}`;

    const functionEnv: NyanBotConfig = {
      region: this.region,
      discordApiUrl: discordApiUrl.stringValue,
      discordApplicationId: discordCredentials
        .secretValueFromJson('appId')
        .toString(),
      discordAuthToken: discordCredentials
        .secretValueFromJson('authToken')
        .toString(),
      discordPublicKey: discordCredentials
        .secretValueFromJson('publicKey')
        .toString(),
      cataasApiUrl: cataasApiUrl.stringValue,
      sendCatPhotoFnName,
    };

    const sendCatPhotoFunction = new NodejsFunction(
      this,
      'Function-SendCatPhoto',
      {
        functionName: sendCatPhotoFnName,
        runtime: Runtime.NODEJS_22_X,
        environment: functionEnv,
        memorySize: 512,
        entry: path.join(__dirname, '../entrypoints/events/send-cat-photo.ts'),
        description: new Date().toISOString(),
        timeout: Duration.seconds(10),
      },
    );

    const routeDiscordWebHookFunction = new NodejsFunction(
      this,
      'Function-RouteDiscordWebhookAction',
      {
        functionName: `nyan-route-discord-webhook-action-${props.stage}`,
        runtime: Runtime.NODEJS_22_X,
        memorySize: 1024,
        environment: functionEnv,
        entry: path.join(
          __dirname,
          '../entrypoints/rest/route-discord-webhook-action.ts',
        ),
        description: new Date().toISOString(),
      },
    );
    sendCatPhotoFunction.grantInvoke(routeDiscordWebHookFunction);

    const api = new RestApi(this, 'API-NyanBot', {
      restApiName: `nyan-bot-api-${props.stage}`,
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
