import { Embed } from './Embed';

export interface DiscordWebhookMessage {
  content: string;
  embeds?: Embed[];
  attachments?: DiscordWebhookMessageAttachment[];
}

export interface DiscordWebhookMessageAttachment {
  id: number;
  description: string;
  filename: string;
}

export interface DiscordWebhookMessageFile {
  filename: string;
  bytes: Blob;
}
