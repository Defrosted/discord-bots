import { describe, expect, test, vi } from 'vitest';

vi.mock('../../config', () => ({ getConfig: vi.fn().mockReturnValue({}) }));
vi.mock('../../di', () => ({ injectConfigureBotUsecase: vi.fn().mockReturnValue(vi.fn()) }));

import { makeHandler } from './configure-bot';

const makeConfigureBot = () => vi.fn().mockResolvedValue(undefined);

const makeValidEvent = () => ({
  serverId: 's1',
  channelId: 'c1',
  token: 'tok',
  options: [{ name: 'register', type: 1, options: [] }],
});

describe('configure-bot event handler', () => {
  test('calls configureBot with validated event data', async () => {
    const configureBot = makeConfigureBot();
    const handler = makeHandler({ configureBot });

    await handler(makeValidEvent());

    expect(configureBot).toHaveBeenCalledTimes(1);
    expect(configureBot).toHaveBeenCalledWith(
      expect.objectContaining({ serverId: 's1', channelId: 'c1', token: 'tok' }),
    );
  });

  test('does not propagate errors from configureBot', async () => {
    const configureBot = vi.fn().mockRejectedValue(new Error('unexpected error'));
    const handler = makeHandler({ configureBot });

    await expect(handler(makeValidEvent())).resolves.toBeUndefined();
  });

  test('does not call configureBot and does not propagate errors for an invalid event', async () => {
    const configureBot = makeConfigureBot();
    const handler = makeHandler({ configureBot });

    await expect(handler({ missing: 'required fields' })).resolves.toBeUndefined();
    expect(configureBot).not.toHaveBeenCalled();
  });

  test('does not call configureBot when token is missing', async () => {
    const configureBot = makeConfigureBot();
    const handler = makeHandler({ configureBot });
    const invalidEvent = { serverId: 's1', channelId: 'c1', options: [] };

    await expect(handler(invalidEvent)).resolves.toBeUndefined();
    expect(configureBot).not.toHaveBeenCalled();
  });
});
