
import { Interaction } from "./types/discord"
import { APIGatewayEventRequestContext, APIGatewayProxyCallbackV2, APIGatewayProxyEvent } from "aws-lambda"
import { HttpRequestError } from "./types/HttpErrorTypes";
import { DiscordSignatureVerifier } from "./utils/DiscordSignatureVerifier";
import { InteractionRouter } from "./utils/InteractionRouter";
import { SSMManager } from "./utils/SSMManager";

export const handler = async (
  event: APIGatewayProxyEvent, 
  context: APIGatewayEventRequestContext, 
  callback: APIGatewayProxyCallbackV2
): Promise<void> => {
  try {
    // Parse body
    const rawBody = event.isBase64Encoded 
      ? Buffer.from(event.body ?? "", "base64").toString()
      : event.body ?? undefined;
    const body = JSON.parse(rawBody ?? "") as Interaction;

    console.debug("Body", body);
    console.debug("Raw body", event.body);
    console.debug("Headers", event.headers);

    // Verify Discord signature
    const { BOT_DISCORD_PUBLIC_KEY } = process.env;
    const publicKey = await new SSMManager()
      .getParameterValue(BOT_DISCORD_PUBLIC_KEY);
    if(!publicKey)
      throw new Error("Failed to retrieve Discord public key");

    const signature = event.headers["X-Signature-Ed25519"] ?? event.headers["x-signature-ed25519"];
    const timestamp = event.headers["X-Signature-Timestamp"] ?? event.headers["x-signature-timestamp"];

    const signatureVerifier = new DiscordSignatureVerifier(publicKey);
    // Need to restringify the body as the raw body has been manipulated by the API Gateway
    signatureVerifier.verify(signature, timestamp, JSON.stringify(body));

    // Handle interaction
    const response = InteractionRouter.routeInteraction(body);

    // Send response
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(response)
    })
  } 
  catch(error) {
    // Catch and handle errors
    if (error instanceof HttpRequestError) {
      callback(error, {
        statusCode: error.code,
        body: JSON.stringify({
          error
        })
      })
    } else if (error instanceof Error) {
      console.error(error)
      callback(error, {
        statusCode: 500,
        body: "Application ran into an error"
      })
    }
  }
}
