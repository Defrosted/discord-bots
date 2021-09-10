
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
    // Verify Discord signature
    const { BOT_DISCORD_PUBLIC_KEY } = process.env;
    const publicKey = await new SSMManager()
      .getParameterValue(BOT_DISCORD_PUBLIC_KEY);
    if(!publicKey)
      throw new Error("Failed to retrieve Discord public key");

    const signature = event.headers["X-Signature-Ed25519"];
    const timestamp = event.headers["X-Signature-Timestamp"];

    console.debug("Body", event.body);

    const signatureVerifier = new DiscordSignatureVerifier(publicKey);
    signatureVerifier.verify(signature, timestamp, event.body ?? undefined);

    // Handle interaction
    const response = InteractionRouter.routeInteraction(
      JSON.parse(event.body ?? "") as Interaction
    );

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
