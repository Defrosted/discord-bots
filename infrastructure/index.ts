import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const cfg = new pulumi.Config();

const discordPublicKey = new aws.ssm.Parameter("discord-public-key", {
  type: "SecureString",
  value: cfg.requireSecret("discord_public_key")
});

const discordApplicationId = new aws.ssm.Parameter("discord-application-id", {
  type: "SecureString",
  value: cfg.requireSecret("discord_application_id")
});

const discordBotToken = new aws.ssm.Parameter("discord-bot-token", {
  type: "SecureString",
  value: cfg.requireSecret("discord_bot_token")
});

const thundraApiKey = new aws.ssm.Parameter("thundra-api-key", {
  type: "SecureString",
  value: cfg.requireSecret("thundra_api_key")
});

const lambdaRole = new aws.iam.Role("botApiFuncRole", {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Principal: {
        Service: "lambda.amazonaws.com"
      },
      Effect: "Allow",
      Sid: ""
    }]
  }
});

const botApiFunc = new aws.lambda.Function("botApiFunc", {
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("../bot/bin/code"),
    "./node_modules": new pulumi.asset.FileArchive("../bot/bin/dependencies/node_modules")
  }),
  runtime: "nodejs14.x",
  handler: "index.handler",
  role: lambdaRole.arn,
  environment: {
    variables: {
      BOT_DISCORD_APPLICATION_ID: discordApplicationId.name,
      BOT_DISCORD_BOT_TOKEN: discordBotToken.name,
      BOT_DISCORD_PUBLIC_KEY: discordPublicKey.name,
      BOT_THUNDRA_API_KEY: thundraApiKey.name
    }
  }
}, {
  dependsOn: lambdaRole,
  parent: lambdaRole
});

new aws.lambda.Permission("botApiFuncPermission-SSM-DiscordPublicKey", {
  action: "lambda:InvokeFunction",
  function: botApiFunc.name,
  principal: "ssm.amazonaws.com",
  sourceArn: discordPublicKey.arn
}, {
  parent: botApiFunc
});

new aws.lambda.Permission("botApiFuncPermission-SSM-DiscordApplicationId", {
  action: "lambda:InvokeFunction",
  function: botApiFunc.name,
  principal: "ssm.amazonaws.com",
  sourceArn: discordApplicationId.arn
}, {
  parent: botApiFunc
});

new aws.lambda.Permission("botApiFuncPermission-SSM-DiscordBotToken", {
  action: "lambda:InvokeFunction",
  function: botApiFunc.name,
  principal: "ssm.amazonaws.com",
  sourceArn: discordBotToken.arn
}, {
  parent: botApiFunc
});

new aws.lambda.Permission("botApiFuncPermission-SSM-ThundraAPIKey", {
  action: "lambda:InvokeFunction",
  function: botApiFunc.name,
  principal: "ssm.amazonaws.com",
  sourceArn: thundraApiKey.arn
}, {
  parent: botApiFunc
});

new aws.iam.RolePolicyAttachment("botApiFuncRoleAttachment-Lambda", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicies.AWSLambdaExecute
}, {
  parent: lambdaRole
});

new aws.iam.RolePolicyAttachment("botApiFuncRoleAttachment-CloudWatch-FullAccess", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicies.CloudWatchFullAccess
}, {
  parent: lambdaRole
});

new aws.iam.RolePolicyAttachment("botApiFuncRoleAttachment-CloudWatch-EventsFullAccess", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicies.CloudWatchEventsFullAccess
}, {
  parent: lambdaRole
});

new aws.iam.RolePolicyAttachment("botApiFuncRoleAttachment-XRay-WriteOnlyAccess", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicies.AWSXrayWriteOnlyAccess
}, {
  parent: lambdaRole
});

new aws.iam.RolePolicyAttachment("botApiFuncRoleAttachment-SSM-ReadOnlyAccess", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicies.AmazonSSMReadOnlyAccess
}, {
  parent: lambdaRole
});

const botApiGateway = new awsx.apigateway.API("botApiGateway", {
  routes: [{
    path: "/",
    method: "ANY",
    eventHandler: botApiFunc,
  }]
});

export const endpointUrl = botApiGateway.url;
