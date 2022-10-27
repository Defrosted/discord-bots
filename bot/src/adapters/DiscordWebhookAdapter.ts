import { DiscordInteraction } from '@domain/DiscordInteraction';
import { IncomingWebhookPort, IncomingBotInteractionPort } from '@ports/IncomingPort';
import { SignatureVerificationPort } from '@ports/SignatureVerificationPort';
import { APIGatewayProxyEvent } from 'aws-lambda';

export class DiscordWebhookAdapter implements IncomingWebhookPort {
  constructor(public interactionService: IncomingBotInteractionPort, public signatureVerificationService: SignatureVerificationPort) {}

  public async process(event: APIGatewayProxyEvent) {
    // Parse body
    const rawBody = event.isBase64Encoded 
      ? Buffer.from(event.body ?? '', 'base64').toString()
      : event.body ?? undefined;
    const body = JSON.parse(rawBody ?? '') as DiscordInteraction;

    const signature = event.headers['X-Signature-Ed25519'] ?? event.headers['x-signature-ed25519'];
    const timestamp = event.headers['X-Signature-Timestamp'] ?? event.headers['x-signature-timestamp'];

    // Need to restringify the body as the raw body JSON has been manipulated by the API Gateway
    await this.signatureVerificationService.verify(signature, timestamp, JSON.stringify(body));

    // Handle interaction
    return this.interactionService.process(body);
  }
}