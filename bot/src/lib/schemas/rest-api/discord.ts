import { z } from 'zod';
import { discordInteractionSchema } from '../shared/discord';

export enum DiscordInteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

export const routeDiscordWebhookRequestSchema = discordInteractionSchema;

export type RouteDiscordWebhookRequest = z.infer<
  typeof routeDiscordWebhookRequestSchema
>;

export enum DiscordInteractionCallbackType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9,
}

export const routeDiscordWebhookResponseSchema = z.object({
  type: z.nativeEnum(DiscordInteractionCallbackType),
});

export type RouteDiscordWebhookResponse = z.infer<
  typeof routeDiscordWebhookResponseSchema
>;
