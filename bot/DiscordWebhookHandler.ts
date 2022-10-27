import { APIGatewayEventRequestContext, APIGatewayProxyCallbackV2, APIGatewayProxyEvent } from 'aws-lambda';
import { HttpRequestError } from '@domain/HttpErrorTypes';
import { DiscordSignatureVerificationService } from './src/services/DiscordSignatureVerifier';
import { InteractionService } from '@services/InteractionService';
import { DiscordWebhookAdapter } from '@adapters/DiscordWebhookAdapter';
import { getSecrets, AppSecrets, config } from '@config/.';
import { RedditService } from '@services/RedditService';
import { DiscordApplicationCommandService } from '@services/ApplicationCommandService';
import { LambdaClient } from '@aws-sdk/client-lambda';

let secrets: AppSecrets | undefined = undefined;
let redditService: RedditService | undefined = undefined;
let signatureVerificationService: DiscordSignatureVerificationService | undefined = undefined;
const interactionService = new InteractionService(
  new DiscordApplicationCommandService(new LambdaClient({
    region: config.region
  }))
);

export const handler = async (
  event: APIGatewayProxyEvent, 
  context: APIGatewayEventRequestContext, 
  callback: APIGatewayProxyCallbackV2
): Promise<void> => {
  try {
    if(!secrets)
      secrets = await getSecrets();

    // Ensure Lambda context services are loaded
    if(!redditService)
      redditService = new RedditService(secrets.reddit.clientId, secrets.reddit.clientSecret);
    if(!redditService.tokenIsValid())
      await redditService.authenticate();
    // Create ephemeral services
    signatureVerificationService = new DiscordSignatureVerificationService(secrets.discord.publicKey);

    // Create webhook adapter and process event
    const discordWebhookAdapter = new DiscordWebhookAdapter(interactionService, signatureVerificationService);
    const response = await discordWebhookAdapter.process(event);

    // Send response
    console.info('Responding 200 OK', response);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(response)
    });
  }
  catch(error) {
    // Catch and handle errors
    if (error instanceof HttpRequestError) {
      callback(error, {
        statusCode: error.code,
        body: JSON.stringify({
          error
        })
      });
    } else if (error instanceof Error) {
      console.error(error);
      callback(error, {
        statusCode: 500,
        body: 'Application ran into an unknown error'
      });
    }
  }
};
