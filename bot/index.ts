
import { Interaction } from './types/discord';
import { APIGatewayEventRequestContext, APIGatewayProxyCallbackV2, APIGatewayProxyEvent } from 'aws-lambda';
import { HttpRequestError } from './types/HttpErrorTypes';
import { DiscordSignatureVerifier } from './integration/discord/DiscordSignatureVerifier';
import { InteractionRouter } from './handlers';

export const handler = async (
  event: APIGatewayProxyEvent, 
  context: APIGatewayEventRequestContext, 
  callback: APIGatewayProxyCallbackV2
): Promise<void> => {
  try {
    // Parse body
    const rawBody = event.isBase64Encoded 
      ? Buffer.from(event.body ?? '', 'base64').toString()
      : event.body ?? undefined;
    const body = JSON.parse(rawBody ?? '') as Interaction;

    const signature = event.headers['X-Signature-Ed25519'] ?? event.headers['x-signature-ed25519'];
    const timestamp = event.headers['X-Signature-Timestamp'] ?? event.headers['x-signature-timestamp'];

    // Verify Discord signature
    const signatureVerifier = new DiscordSignatureVerifier();
    // Need to restringify the body as the raw body JSON has been manipulated by the API Gateway
    await signatureVerifier.verify(signature, timestamp, JSON.stringify(body));

    // Handle interaction
    const response = await InteractionRouter.routeInteraction(body);

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
        body: 'Application ran into an error'
      });
    }
  }
};
