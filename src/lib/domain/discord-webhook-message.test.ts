import { describe, expect, test } from 'vitest';
import { DiscordWebhookMessage } from './discord-webhook-message';
import { RedditEmbed } from './reddit-embed';

const makeImageEmbed = () =>
  new RedditEmbed({
    title: 'Meme',
    url: 'https://i.redd.it/meme.jpg',
    description: 'Meme',
    isVideo: false,
  });

const makeVideoEmbed = () =>
  new RedditEmbed({
    title: 'Video',
    url: 'https://v.redd.it/video',
    description: 'Video',
    isVideo: true,
  });

describe('DiscordWebhookMessage', () => {
  describe('constructor', () => {
    test('sets content', () => {
      const msg = new DiscordWebhookMessage({ content: 'hello' });
      expect(msg.content).toBe('hello');
    });

    test('defaults embeds to empty array when not provided', () => {
      const msg = new DiscordWebhookMessage({ content: 'hello' });
      expect(msg.embeds).toEqual([]);
    });

    test('uses provided embeds', () => {
      const embeds = [{ title: 'T', description: 'D', url: 'U' }];
      const msg = new DiscordWebhookMessage({ content: 'hello', embeds });
      expect(msg.embeds).toEqual(embeds);
    });
  });

  describe('getContentType', () => {
    test('returns application/json when no files', () => {
      const msg = new DiscordWebhookMessage({ content: 'hello' });
      expect(msg.getContentType()).toBe('application/json');
    });

    test('returns multipart/form-data when files are present', () => {
      const msg = new DiscordWebhookMessage({
        content: 'hello',
        files: [{ filename: 'a.txt', bytes: new Blob(['data']) }],
      });
      expect(msg.getContentType()).toBe('multipart/form-data');
    });
  });

  describe('addRedditEmbed', () => {
    test('appends video URL to content for video embeds', () => {
      const msg = new DiscordWebhookMessage({ content: 'It is Wednesday' });
      msg.addRedditEmbed(makeVideoEmbed());
      expect(msg.content).toBe('It is Wednesday https://v.redd.it/video');
    });

    test('does not add to embeds array for video posts', () => {
      const msg = new DiscordWebhookMessage({ content: 'It is Wednesday' });
      msg.addRedditEmbed(makeVideoEmbed());
      expect(msg.embeds).toHaveLength(0);
    });

    test('adds image embed to embeds array for non-video posts', () => {
      const msg = new DiscordWebhookMessage({ content: 'It is Wednesday' });
      msg.addRedditEmbed(makeImageEmbed());
      expect(msg.embeds).toHaveLength(1);
      expect(msg.embeds[0]).toMatchObject({
        title: 'Meme',
        description: 'Meme',
        url: 'https://i.redd.it/meme.jpg',
        image: { url: 'https://i.redd.it/meme.jpg' },
      });
    });

    test('does not modify content for image embeds', () => {
      const msg = new DiscordWebhookMessage({ content: 'It is Wednesday' });
      msg.addRedditEmbed(makeImageEmbed());
      expect(msg.content).toBe('It is Wednesday');
    });
  });

  describe('toRequestBody', () => {
    test('returns a plain object when no files are present', () => {
      const msg = new DiscordWebhookMessage({ content: 'hello' });
      const body = msg.toRequestBody();
      expect(body).not.toBeInstanceOf(FormData);
      expect(body).toMatchObject({ content: 'hello', embeds: [] });
    });

    test('does not include files key in plain object body', () => {
      const msg = new DiscordWebhookMessage({ content: 'hello' });
      const body = msg.toRequestBody() as Record<string, unknown>;
      expect(body).not.toHaveProperty('files');
    });

    test('returns FormData when files are present', () => {
      const msg = new DiscordWebhookMessage({
        content: 'hello',
        files: [{ filename: 'a.txt', bytes: new Blob(['data']) }],
      });
      expect(msg.toRequestBody()).toBeInstanceOf(FormData);
    });
  });
});
