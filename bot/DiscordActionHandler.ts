import { DiscordRequestAdapter } from '@adapters/DiscordRequestAdapter';
import { AppSecrets, getSecrets } from '@config/.';
import { HttpRequestError } from '@domain/HttpErrorTypes';
import { ActionEvent } from '@ports/ActionPort';
import { DiscordActions, DiscordActionService } from '@services/DiscordActionService';
import { RedditService } from '@services/RedditService';
import { APIGatewayProxyCallbackV2, Context } from 'aws-lambda';

let secrets: AppSecrets | undefined = undefined;
let redditService: RedditService | undefined = undefined;

export const handler = async (
  event: ActionEvent, 
  context: Context, 
  callback: APIGatewayProxyCallbackV2
): Promise<void> => {
  try {
    if(!secrets)
      secrets = await getSecrets();
    redditService = new RedditService(secrets.reddit.clientId, secrets.reddit.clientSecret);
    const discordRequestAdapter = new DiscordRequestAdapter(secrets.discord.applicationId);
    const actionService = new DiscordActionService(redditService, discordRequestAdapter);

    const { action, data } = event;
    await actionService.performAction(action as DiscordActions, data);

    // Send response
    console.info('Responding 200 OK');
    callback(null, {
      statusCode: 200
    });
  } catch(error) {
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
