import { describe, expect, test } from 'vitest';
import { BotConfiguration } from './bot-configuration';

describe('BotConfiguration', () => {
  test('stores serverId and channelId from constructor', () => {
    const config = new BotConfiguration({ serverId: 's1', channelId: 'c1' });

    expect(config.serverId).toBe('s1');
    expect(config.channelId).toBe('c1');
  });

  test('toObject returns a plain object with the same values', () => {
    const config = new BotConfiguration({ serverId: 's1', channelId: 'c1' });

    expect(config.toObject()).toEqual({ serverId: 's1', channelId: 'c1' });
  });

  test('toObject returns a copy, not the instance itself', () => {
    const config = new BotConfiguration({ serverId: 's1', channelId: 'c1' });

    expect(config.toObject()).not.toBe(config);
  });
});
