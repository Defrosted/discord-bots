import { DiscordInteraction, DiscordInteractionResponse } from '@domain/DiscordInteraction';
import { APIGatewayProxyEvent } from 'aws-lambda';

export interface IncomingBotInteractionPort {
  process: (interaction: DiscordInteraction) => Promise<DiscordInteractionResponse>;
}

export interface IncomingWebhookPort {
  process(event: APIGatewayProxyEvent): Promise<unknown>;
}
