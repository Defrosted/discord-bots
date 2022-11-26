import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Rule, RuleTargetInput, Schedule } from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cdk from 'aws-cdk-lib';

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
    const commonDiscordLambdaProperties: Partial<nodejs.NodejsFunctionProps> = {
      environment: {
        BOT_DISCORD_APPLICATION_ID: discordApplicationId.parameterName,
        BOT_DISCORD_TOKEN: discordBotToken.parameterName,
        BOT_DISCORD_PUBLIC_KEY: discordPublicKey.parameterName,
        REDDIT_CLIENT_ID: redditClientId.parameterName,
        REDDIT_CLIENT_SECRET: redditSecret.parameterName
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(30)
    };

    const actionFunctionRole = new iam.Role(this, 'discordBot-actionFunctionRole', {
      roleName: 'discordBot-actionFunctionRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    addLambdaRolePermissions(actionFunctionRole);

    this.discordActionFunction = new nodejs.NodejsFunction(this, 'discordBot-actionFunction', {
      ...commonDiscordLambdaProperties,
      entry: path.join(__dirname, '../..', 'bot/DiscordActionHandler.ts'),
      runtime: lambdaRuntime,
      functionName: 'discordBot-actionFunction',
      role: actionFunctionRole
    });

    const webHookFunctionRole = new iam.Role(this, 'discordBot-webhookFunctionRole', {
      roleName: 'discordBot-webhookFunctionRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    addLambdaRolePermissions(webHookFunctionRole);

    this.discordWebhookFunction = new nodejs.NodejsFunction(this, 'discordBot-webhookFunction', {
      ...commonDiscordLambdaProperties,
      runtime: lambdaRuntime,
      entry: path.join(__dirname, '../..', 'bot/DiscordWebhookHandler.ts'),
      role: webHookFunctionRole,
      functionName: 'discordBot-webhookFunction',
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

    const wednesdayDynamoDBTable = new dynamodb.Table(this, 'discordBot-wednesdayRegistration-table', {
      tableName: 'discordBot-wednesdayRegistration',
      partitionKey: {
        name: 'guild_id',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'channel_id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });
    wednesdayDynamoDBTable.grantReadWriteData(actionFunctionRole);
    this.discordActionFunction.addEnvironment('WEDNESDAY_DYNAMODB_TABLE', wednesdayDynamoDBTable.tableName);

    new Rule(this, 'wednesday-meme-scheduler', {
      schedule: Schedule.cron({ weekDay: 'WED', minute: '0', hour: '0' }),
      targets: [ 
        new targets.LambdaFunction(this.discordActionFunction, {
          event: RuleTargetInput.fromObject(
            {
              action: 'sendScheduledWednesdayMeme'
            }
          )
        }) 
      ]
    });
  }
}
