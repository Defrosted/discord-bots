export enum ApplicationCommandType {
  CHAT_INPUT = 1,
  USER = 2,
  MESSAGE = 3
}

export interface ApplicationCommand {
  id: string;
  type: ApplicationCommandType;
  application_id: string;
  guild_id?: string;
  name: string;
  description: string;
  options?: ApplicationCommandOption[];
  default_permission?: boolean;
  version: string;
}

export enum ApplicationCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
  NUMBER = 10,
  ATTACHMENT = 11
}

export interface ApplicationCommandOption {
  type: ApplicationCommandOptionType;
  name: string;
  description: string;
  required?: boolean;
  choices?: {
    name: string;
    value: string | number;
  }[];
  options?: ApplicationCommandInteractionOption[];
}

export interface ApplicationCommandInteractionOption {
  name: string;
  type: ApplicationCommandOptionType;
  value: string | number;
  options?: ApplicationCommandInteractionOption[];
  focused?: boolean;
}
