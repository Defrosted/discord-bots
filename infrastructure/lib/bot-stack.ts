import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class BotStack extends Stack {
  public readonly lambdaFunction: lambda.Function;

  constructor (scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const discordPublicKey = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'discordBot-ssm-publicKey', {
      parameterName: '/wednesday/publicKey'
    });

    const discordApplicationId = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'discordBot-ssm-applicationId', {
      parameterName: '/wednesday/applicationId'
    });

    const discordBotToken = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'discordBot-ssm-botToken', {
      parameterName: '/wednesday/botToken'
    });

    const redditClientId = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'discordBot-ssm-redditClientId', {
      parameterName: '/wednesday/redditClientId'
    });

    const redditSecret = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'discordBot-ssm-redditSecret', {
      parameterName: '/wednesday/redditSecret'
    });

    const lambdaRole = new iam.Role(this, 'discordBot-lambdaRole', {
      roleName: 'discordBot-lambdaRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    discordPublicKey.grantRead(lambdaRole);
    discordApplicationId.grantRead(lambdaRole);
    discordBotToken.grantRead(lambdaRole);
    redditClientId.grantRead(lambdaRole);
    redditSecret.grantRead(lambdaRole);

    const lambdaRuntime = lambda.Runtime.NODEJS_16_X;
    this.lambdaFunction = new lambda.Function(this, 'discordBot-lambdaFunction', {
      runtime: lambdaRuntime,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../bot/bin/code')),
      role: lambdaRole,
      functionName: 'discordBot-lambdaFunction',
      environment: {
        BOT_DISCORD_APPLICATION_ID: discordApplicationId.parameterName,
        BOT_DISCORD_BOT_TOKEN: discordBotToken.parameterName,
        BOT_DISCORD_PUBLIC_KEY: discordPublicKey.parameterName,
        REDDIT_CLIENT_ID: redditClientId.parameterName,
        REDDIT_CLIENT_SECRET: redditSecret.parameterName
      },
      layers: [
        new lambda.LayerVersion(this, 'discordBot-lambdaFunctionDependencies', {
          code: lambda.Code.fromAsset(path.join(__dirname, '../../bot/bin/dependencies')),
          description: 'Node libraries for lambda',
          compatibleRuntimes: [ lambdaRuntime ]
        })
      ]
    });
    const lambdaFunctionUrl = this.lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Signature-Ed25519',
          'x-signature-ed25519',
          'X-Signature-Timestamp',
          'x-signature-timestamp'
        ],
        allowCredentials: true,
        allowedMethods: [ lambda.HttpMethod.ALL ],
        allowedOrigins: [ '*' ]
      },
    });

    new CfnOutput(this, 'bot-function-url', {
      value: lambdaFunctionUrl.url
    });
  }
}
