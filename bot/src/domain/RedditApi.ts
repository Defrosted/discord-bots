export interface RedditAuthResponse {
  'access_token': string;
  'expires_in': number;
}

export interface RedditListingResponse {
  kind: string;
  data: {
    children: RedditListingDataChildren[];
  };
}

export interface RedditListingDataChildren {
  kind: string;
  data: {
    url?: string;
    title: string;
    is_video: boolean;
  }
}

export interface RedditEmbed {
  title: string;
  url?: string;
  description: string;
  isVideo: boolean;
}
