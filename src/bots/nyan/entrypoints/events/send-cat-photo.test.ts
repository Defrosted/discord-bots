import { describe, expect, test, vi } from 'vitest';

vi.mock('../../config', () => ({ getConfig: vi.fn().mockReturnValue({}) }));
vi.mock('../../di', () => ({ injectSendCatPhotoUsecase: vi.fn().mockReturnValue(vi.fn()) }));

import { makeHandler } from './send-cat-photo';

const makeSendCatPhoto = () => vi.fn().mockResolvedValue(undefined);

describe('send-cat-photo event handler', () => {
  test('calls sendCatPhoto with the validated event params', async () => {
    const sendCatPhoto = makeSendCatPhoto();
    const handler = makeHandler({ sendCatPhoto });

    await handler({ token: 'tok', channelId: 'ch1', serverId: 's1' });

    expect(sendCatPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok', channelId: 'ch1', serverId: 's1' }),
    );
  });

  test('passes tags to sendCatPhoto when present', async () => {
    const sendCatPhoto = makeSendCatPhoto();
    const handler = makeHandler({ sendCatPhoto });

    await handler({ token: 'tok', channelId: 'ch1', tags: 'cute' });

    expect(sendCatPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ tags: 'cute' }),
    );
  });

  test('does not propagate errors from sendCatPhoto', async () => {
    const sendCatPhoto = vi.fn().mockRejectedValue(new Error('boom'));
    const handler = makeHandler({ sendCatPhoto });

    await expect(handler({ token: 'tok', channelId: 'ch1' })).resolves.toBeUndefined();
  });

  test('does not call sendCatPhoto for invalid input', async () => {
    const sendCatPhoto = makeSendCatPhoto();
    const handler = makeHandler({ sendCatPhoto });

    await expect(handler(null)).resolves.toBeUndefined();
    expect(sendCatPhoto).not.toHaveBeenCalled();
  });
});
