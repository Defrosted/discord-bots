import { AwsDynamoDbAdapter } from '@adapters/AwsDynamoDbAdapter';
import { DiscordRequestAdapter } from '@adapters/DiscordRequestAdapter';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getConfig, getSecrets } from '@config/.';
import { HttpRequestError } from '@domain/HttpErrorTypes';
import { ActionEvent } from '@ports/ActionPort';
import {
  DiscordActions,
  DiscordActionService,
  DynamoDBRegistrationSchema,
} from '@services/DiscordActionService';
import { RedditService } from '@services/RedditService';
import { APIGatewayProxyCallbackV2, Context } from 'aws-lambda';

const config = getConfig([ 'ACTION_LAMBDA_FUNCTIONNAME' ] as const);
const secrets = getSecrets(config);
let redditService: RedditService | undefined = undefined;

export const handler = async (
  event: ActionEvent,
  context: Context,
  callback: APIGatewayProxyCallbackV2
): Promise<void> => {
  try {
    const [
      redditClientId, redditClientSecret, discordApplicationId, discordToken
    ] = await Promise.all([
      secrets.redditClientId, secrets.redditClientSecret, secrets.discordApplicationId, secrets.discordToken
    ]);
    redditService = new RedditService(
      redditClientId,
      redditClientSecret
    );
    const discordRequestAdapter = new DiscordRequestAdapter();
    const wednesdayRegistrationDynamoAdapter =
      new AwsDynamoDbAdapter<DynamoDBRegistrationSchema>(
        new DynamoDBClient({
          region: config.region,
        }),
        config.aws.wednesdayDynamodbTableName
      );
    const actionService = new DiscordActionService(
      discordApplicationId,
      discordToken,
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
