import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class BotStack extends Stack {
  public readonly discordWebhookFunction: lambda.Function;
  public readonly discordActionFunction: lambda.Function;

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

    const addLambdaRolePermissions = (lambdaRole: iam.Role) => {
      lambdaRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      );
  
      discordPublicKey.grantRead(lambdaRole);
      discordApplicationId.grantRead(lambdaRole);
      discordBotToken.grantRead(lambdaRole);
      redditClientId.grantRead(lambdaRole);
      redditSecret.grantRead(lambdaRole);
    };

    const lambdaRuntime = lambda.Runtime.NODEJS_16_X;
    const lambdaCodeBundle = lambda.Code.fromAsset(path.join(__dirname, '../../bot/bin/code'));
    const commonDiscordLambdaProperties: Partial<lambda.FunctionProps> = {
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
    };

    const actionFunctionRole = new iam.Role(this, 'discordBot-actionFunctionRole', {
      roleName: 'discordBot-actionFunctionRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    addLambdaRolePermissions(actionFunctionRole);

    this.discordActionFunction = new lambda.Function(this, 'discordBot-actionFunction', {
      ...commonDiscordLambdaProperties,
      runtime: lambdaRuntime,
      handler: 'DiscordActionHandler.handler',
      functionName: 'discordBot-actionFunction',
      code: lambdaCodeBundle,
      role: actionFunctionRole
    });

    const webHookFunctionRole = new iam.Role(this, 'discordBot-webhookFunctionRole', {
      roleName: 'discordBot-webhookFunctionRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    addLambdaRolePermissions(webHookFunctionRole);

    this.discordWebhookFunction = new lambda.Function(this, 'discordBot-webhookFunction', {
      ...commonDiscordLambdaProperties,
      runtime: lambdaRuntime,
      handler: 'DiscordWebhookHandler.handler',
      role: webHookFunctionRole,
      functionName: 'discordBot-webhookFunction',
      code: lambdaCodeBundle,
      environment: {
        ...commonDiscordLambdaProperties.environment,
        ACTION_LAMBDA_FUNCTIONNAME: this.discordActionFunction.functionName
      }
    });
    // Allow action invokes from webhook function
    this.discordActionFunction.grantInvoke(this.discordWebhookFunction);
    

    const lambdaFunctionUrl = this.discordWebhookFunction.addFunctionUrl({
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
