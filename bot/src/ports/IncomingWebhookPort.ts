import { InteractionResponse } from '@domain/Interaction';
import { APIGatewayProxyEvent } from 'aws-lambda';

export interface IncomingWebhookPort {
  process(event: APIGatewayProxyEvent): Promise<InteractionResponse>;
}