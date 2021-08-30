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
  MESSAGE_COMPONENT = 3
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
