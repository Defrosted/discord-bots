import * as R from 'ramda';
import { RedditEmbed } from './reddit-embed';

export interface IDiscordWebhookMessage {
  content: string;
  embeds?: DiscordMessageEmbed[];
  attachments?: DiscordWebhookMessageAttachment[];
  files?: DiscordWebhookMessageFile[];
}

export class DiscordWebhookMessage implements IDiscordWebhookMessage {
  content: string;
  embeds: DiscordMessageEmbed[];
  attachments?: DiscordWebhookMessageAttachment[];
  files?: DiscordWebhookMessageFile[];

  constructor(params: IDiscordWebhookMessage) {
    this.content = params.content;
    this.embeds = params.embeds ?? [];
    this.attachments = params.attachments;
    this.files = params.files;
  }

  public getContentType(): 'application/json' | 'multipart/form-data' {
    if (!this.files) return 'application/json';
    return 'multipart/form-data';
  }

  public toRequestBody() {
    if (!this.files) return this.getPayload();

    return this.toFormData();
  }

  public addRedditEmbed(embed: RedditEmbed) {
    if (embed.isVideo) {
      this.content += ` ${embed.url}`;
      return;
    }

    const { title, description, url } = embed;
    this.embeds.push({
      title,
      description,
      url,
      image: {
        url,
      },
    });
  }

  public toObject() {
    return { ...this };
  }

  private getPayload() {
    return R.pick(['content', 'embeds', 'attachments'], this);
  }

  private toFormData() {
    const formData = new FormData();

    // Append content
    formData.append(
      'payload_json',
      new Blob([JSON.stringify(this.getPayload())], {
        type: 'application/json',
      }),
    );

    this.files?.forEach(({ bytes, filename }, index) => {
      formData.append(`file[${index}]`, bytes, filename);
    });

    return formData;
  }
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

export type DiscordMessageEmbedTypeKeys = 'image' | 'video';

export interface DiscordMessageEmbedObject {
  title: string;
  url?: string;
  description: string;
}

export type DiscordMessageEmbed = {
  [key in DiscordMessageEmbedTypeKeys]?: {
    url: string;
  };
} & DiscordMessageEmbedObject;
