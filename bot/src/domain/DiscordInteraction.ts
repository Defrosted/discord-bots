export interface DiscordInteraction {
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

export enum DiscordInteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5
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
}

export interface DiscordInteractionOption {
  name: string;
  type: number;
  options?: DiscordInteractionOption[];
}

export interface DiscordInteractionResolvedData {
  users?: object[];
  members?: object[];
  roles?: object[];
  channels?: object[];
  messages: object[];
}

export enum DiscordInteractionCallbackType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9
}

export interface DiscordInteractionResponse {
  type: DiscordInteractionCallbackType;
  data?: DiscordInteractionCallbackMessage;
}

export interface DiscordInteractionCallbackMessage {
  tts?: boolean;
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
  allowed_mentions?: object[];
  flags?: number;
  components?: object[];
  attachments?: object[];
}
