import { RedditPost } from '@lib/schemas/shared/reddit';

export interface IRedditEmbed {
  title: string;
  url: string;
  description: string;
  isVideo: boolean;
}

export type RedditPostWithUrl = RedditPost & {
  data: Required<RedditPost['data']>;
};

export class RedditEmbed implements IRedditEmbed {
  public title: string;
  public url: string;
  public description: string;
  public isVideo: boolean;

  constructor({ title, url, description, isVideo }: IRedditEmbed) {
    this.title = title;
    this.url = url;
    this.description = description;
    this.isVideo = isVideo;
  }

  public static fromPost(post: RedditPostWithUrl) {
    const { url, title, is_video } = post.data;
    return new RedditEmbed({
      url,
      title,
      isVideo: is_video,
      description: title,
    });
  }
}
