type EmbedTypeKeys = 'image' | 'video';

interface EmbedObject {
  title: string;
  url?: string;
  description: string;
}

export type Embed = {
  [key in EmbedTypeKeys]?: {
    url: string;
  }
} & EmbedObject;
