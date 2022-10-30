import {
  APIGatewayEventRequestContext,
  APIGatewayProxyCallbackV2,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import { HttpRequestError } from '@domain/HttpErrorTypes';
import { DiscordSignatureVerificationService } from './src/services/DiscordSignatureVerifier';
import { InteractionService } from '@services/InteractionService';
import { DiscordWebhookAdapter } from '@adapters/DiscordWebhookAdapter';
import { getSecrets, AppSecrets, getConfig } from '@config/.';
import { RedditService } from '@services/RedditService';
import { DiscordApplicationCommandService } from '@services/ApplicationCommandService';
import { LambdaClient } from '@aws-sdk/client-lambda';

let secrets: AppSecrets | undefined = undefined;
let redditService: RedditService | undefined = undefined;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: APIGatewayEventRequestContext,
  callback: APIGatewayProxyCallbackV2
): Promise<void> => {
  try {
    const config = getConfig([ 'WEDNESDAY_DYNAMODB_TABLE' ] as const);
    if (!secrets) secrets = await getSecrets(config);

    // Ensure Lambda context services are loaded
    if (!redditService)
      redditService = new RedditService(
        secrets.reddit.clientId,
        secrets.reddit.clientSecret
      );
    if (!redditService.tokenIsValid()) await redditService.authenticate();
    // Create ephemeral services
    const signatureVerificationService =
      new DiscordSignatureVerificationService(secrets.discord.publicKey);
    const interactionService = new InteractionService(
      new DiscordApplicationCommandService(
        new LambdaClient({
          region: config.region,
        }),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        config.actionLambdaFunctionName!
      )
    );

    // Create webhook adapter and process event
    const discordWebhookAdapter = new DiscordWebhookAdapter(
      interactionService,
      signatureVerificationService
    );
    const response = await discordWebhookAdapter.process(event);

    // Send response
    console.info('Responding 200 OK', response);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(response),
    });
  } catch (error) {
    // Catch and handle errors
    if (error instanceof HttpRequestError) {
      callback(error, {
        statusCode: error.code,
        body: JSON.stringify({
          error,
        }),
      });
    } else if (error instanceof Error) {
      console.error(error);
      callback(error, {
        statusCode: 500,
        body: 'Application ran into an unknown error',
      });
    }
  }
};
