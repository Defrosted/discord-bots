export interface Interaction {
  id: string;
  application_id: string;
  type: InteractionType;
  data?: InteractionData;
  guild_id?: string;
  channel_id?: string;
  member?: object;
  user?: object;
  token: string;
  version: Readonly<number>;
  message?: object;
}

export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5
}

export interface InteractionData {
  id: string;
  name: string;
  type: number;
  resolved?: InteractionResolvedData;
  options?: object[];
  custom_id?: string;
  component_type?: number;
  values?: object[];
  target_id: string;
}

export interface InteractionResolvedData {
  users?: object[];
  members?: object[];
  roles?: object[];
  channels?: object[];
  messages: object[];
}

export enum InteractionCallbackType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9
}

export interface InteractionResponse {
  type: InteractionCallbackType;
  data?: InteractionCallbackMessage;
}

export interface InteractionCallbackMessage {
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
