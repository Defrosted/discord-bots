import { describe, expect, test } from 'vitest';
import { RedditEmbed, RedditPostWithUrl } from './reddit-embed';

const makePost = (overrides: Partial<RedditPostWithUrl['data']> = {}): RedditPostWithUrl => ({
  kind: 't3',
  data: {
    url: 'https://i.redd.it/image.jpg',
    title: 'Funny meme',
    is_video: false,
    ...overrides,
  },
});

describe('RedditEmbed', () => {
  describe('constructor', () => {
    test('sets all properties', () => {
      const embed = new RedditEmbed({
        title: 'My Title',
        url: 'https://example.com',
        description: 'My description',
        isVideo: false,
      });

      expect(embed.title).toBe('My Title');
      expect(embed.url).toBe('https://example.com');
      expect(embed.description).toBe('My description');
      expect(embed.isVideo).toBe(false);
    });
  });

  describe('fromPost', () => {
    test('creates an embed from a post', () => {
      const post = makePost();
      const embed = RedditEmbed.fromPost(post);

      expect(embed.url).toBe('https://i.redd.it/image.jpg');
      expect(embed.title).toBe('Funny meme');
      expect(embed.description).toBe('Funny meme');
      expect(embed.isVideo).toBe(false);
    });

    test('sets isVideo true for video posts', () => {
      const post = makePost({ is_video: true });
      const embed = RedditEmbed.fromPost(post);
      expect(embed.isVideo).toBe(true);
    });

    test('uses post title as description', () => {
      const post = makePost({ title: 'Some post title' });
      const embed = RedditEmbed.fromPost(post);
      expect(embed.description).toBe('Some post title');
    });

    test('returns an instance of RedditEmbed', () => {
      expect(RedditEmbed.fromPost(makePost())).toBeInstanceOf(RedditEmbed);
    });
  });
});
