import { describe, expect, test, vi } from 'vitest';

vi.mock('../../config', () => ({ getConfig: vi.fn().mockReturnValue({}) }));
vi.mock('../../di', () => ({ injectSendWednesdayMemeUsecase: vi.fn().mockReturnValue(vi.fn()) }));

import { makeHandler } from './send-wednesday-meme';

const makeSendWednesdayMeme = () => vi.fn().mockResolvedValue(undefined);

describe('send-wednesday-meme event handler', () => {
  describe('slash command flow (non-empty event)', () => {
    test('calls sendWednesdayMeme with params when event has content', async () => {
      const sendWednesdayMeme = makeSendWednesdayMeme();
      const handler = makeHandler({ sendWednesdayMeme });

      await handler({ serverId: 's1', channelId: 'c1', token: 'tok' });

      expect(sendWednesdayMeme).toHaveBeenCalledWith(
        expect.objectContaining({ serverId: 's1', channelId: 'c1', token: 'tok' }),
      );
    });
  });

  describe('scheduled broadcast flow (empty event)', () => {
    test('calls sendWednesdayMeme with undefined when event is an empty object', async () => {
      const sendWednesdayMeme = makeSendWednesdayMeme();
      const handler = makeHandler({ sendWednesdayMeme });

      await handler({});

      expect(sendWednesdayMeme).toHaveBeenCalledWith(undefined);
    });
  });

  describe('error handling', () => {
    test('does not propagate errors from sendWednesdayMeme', async () => {
      const sendWednesdayMeme = vi.fn().mockRejectedValue(new Error('boom'));
      const handler = makeHandler({ sendWednesdayMeme });

      await expect(handler({})).resolves.toBeUndefined();
    });

    test('does not propagate validation errors and does not call sendWednesdayMeme for null input', async () => {
      const sendWednesdayMeme = makeSendWednesdayMeme();
      const handler = makeHandler({ sendWednesdayMeme });

      await expect(handler(null)).resolves.toBeUndefined();
      expect(sendWednesdayMeme).not.toHaveBeenCalled();
    });
  });
});
