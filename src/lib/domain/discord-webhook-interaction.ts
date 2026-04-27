/* export interface DiscordInteraction {
  id: string;
  application_id: string;
  type: DiscordInteractionType;
  data?: DiscordInteractionData;
  guild_id?: string;
  channel_id?: string;
  member?: object;
  user?: object;
  token: string;
  version: Readonly<number>;
  message?: object;
}

export interface DiscordInteractionData {
  id: string;
  name: string;
  type: number;
  resolved?: DiscordInteractionResolvedData;
  options?: DiscordInteractionOption[];
  custom_id?: string;
  component_type?: number;
  values?: object[];
  target_id: string;
} */

export enum DiscordInteractionReplyType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9,
}

export interface DiscordInteractionReply {
  type: DiscordInteractionReplyType;
  data?: DiscordInteractionReplyMessage;
}

export interface DiscordInteractionReplyMessage {
  content?: string;
  embeds?: {
    title?: string;
    type?: string;
    description?: string;
    url?: string;
    timestamp?: string;
    color?: number;
    footer?: object;
    image?: object;
    thumbnail?: object;
    video?: object;
    provider?: object;
    author?: object;
    fields?: object[];
  }[];
  components?: object[];
  attachments?: object[];
}
