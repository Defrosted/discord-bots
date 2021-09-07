import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as cloud from "@pulumi/cloud"
import serverlessExpress from "@vendia/serverless-express"
import awsLambda from "aws-lambda"
import { appWrapper } from "./bot";

const cfg = new pulumi.Config()

const discordPublicKey = new aws.ssm.Parameter("discord-public-key", {
  type: "SecureString",
  value: cfg.requireSecret("discord_public_key")
})

const discordApplicationId = new aws.ssm.Parameter("discord-application-id", {
  type: "SecureString",
  value: cfg.requireSecret("discord_application_id")
})

const discordBotToken = new aws.ssm.Parameter("discord-bot-token", {
  type: "SecureString",
  value: cfg.requireSecret("discord_bot_token")
})

const thundraApiKey = new aws.ssm.Parameter("thundra-api-key", {
  type: "SecureString",
  value: cfg.requireSecret("thundra_api_key")
})

/*const lambdaRole = new aws.iam.Role("lambdaRole", {
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
})

new aws.iam.RolePolicyAttachment("botApiFuncRoleAttachment", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicies.AWSLambdaExecute
})

const botApiFunc = new aws.lambda.Function("botApiFunc", {
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./bin/bot"),
    "./node_modules": new pulumi.asset.FileArchive("./node_modules")
  }),
  runtime: "nodejs14.x",
  handler: "index.handler",
  role: lambdaRole.arn,
  environment: {
    variables: {
      DISCORD_APPLICATION_ID: discordApplicationId.id,
      DISCORD_BOT_TOKEN: discordBotToken.value,
      DISCORD_PUBLIC_KEY: JSON.stringify({ id: discordPublicKey.id, name: discordPublicKey.name }),
      THUNDRA_API_KEY: thundraApiKey.value
    }
  }
})

const ssmPermission = new aws.lambda.Permission("ssmPermission", {
  action: "lambda:InvokeFunction",
  function: botApiFunc.name,
  principal: "ssm.amazonaws.com",
  sourceArn: discordPublicKey.arn
})

const botApiGateway = new awsx.apigateway.API("botApiGateway", {
  routes: [{
    path: "/",
    method: "ANY",
    eventHandler: botApiFunc
  }]
})*/

const botApiGateway = new awsx.apigateway.API("botApi", {
  routes: [{
    path: "/",
    method: "ANY",
    eventHandler: (event, context, callback) => {
      const server = serverlessExpress({ 
        app: appWrapper({
          discordPublicKey: discordPublicKey.value.get()
        }) 
      })

      return server(event, context as unknown as awsLambda.Context, callback)
    }
  }]
})

/*const botApiGateway = new cloud.HttpServer("botApi", () => appWrapper({
  discordPublicKey: discordPublicKey.value.get()
}))*/

export const endpointUrl = botApiGateway.url
