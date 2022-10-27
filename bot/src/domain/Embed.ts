export interface Embed {
  title: string;
  url?: string;
  description: string;
  image?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  }
}
