import { AwsDynamoDbAdapter } from '@adapters/AwsDynamoDbAdapter';
import { DiscordRequestAdapter } from '@adapters/DiscordRequestAdapter';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { AppSecrets, getConfig, getSecrets } from '@config/.';
import { HttpRequestError } from '@domain/HttpErrorTypes';
import { ActionEvent } from '@ports/ActionPort';
import {
  DiscordActions,
  DiscordActionService,
  DynamoDBRegistrationSchema,
} from '@services/DiscordActionService';
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
    const config = getConfig([ 'ACTION_LAMBDA_FUNCTIONNAME' ] as const);
    if (!secrets) secrets = await getSecrets(config);
    redditService = new RedditService(
      secrets.reddit.clientId,
      secrets.reddit.clientSecret
    );
    const discordRequestAdapter = new DiscordRequestAdapter();
    const wednesdayRegistrationDynamoAdapter =
      new AwsDynamoDbAdapter<DynamoDBRegistrationSchema>(
        new DynamoDBClient({
          region: config.region,
        }),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        config.aws.wednesdayDynamodbTableName!
      );
    const actionService = new DiscordActionService(
      secrets.discord.applicationId,
      secrets.discord.token,
      redditService,
      discordRequestAdapter,
      wednesdayRegistrationDynamoAdapter
    );

    const { action, data } = event;
    await actionService.performAction(action as DiscordActions, data);

    // Send response
    console.info('Responding 200 OK');
    callback(null, {
      statusCode: 200,
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
