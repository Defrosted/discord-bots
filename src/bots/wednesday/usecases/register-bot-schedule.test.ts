import { describe, expect, test, vi } from 'vitest';
import { BotConfiguration } from '../domain/bot-configuration';
import { makeRegisterBotScheduleUsecase } from './register-bot-schedule';

const makeDeps = () => ({
  botConfigurationRepository: {
    getAll: vi.fn(),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  },
  discordApiRepository: {
    patchOriginalMessage: vi.fn().mockResolvedValue(undefined),
    postMessageToChannel: vi.fn(),
  },
});

describe('makeRegisterBotScheduleUsecase', () => {
  test('saves the configuration to the repository', async () => {
    const deps = makeDeps();
    const usecase = makeRegisterBotScheduleUsecase(deps);

    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    expect(deps.botConfigurationRepository.put).toHaveBeenCalledTimes(1);
  });

  test('saves a BotConfiguration instance with the correct values', async () => {
    const deps = makeDeps();
    const usecase = makeRegisterBotScheduleUsecase(deps);

    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    const [arg] = deps.botConfigurationRepository.put.mock.calls[0];
    expect(arg).toBeInstanceOf(BotConfiguration);
    expect(arg.serverId).toBe('s1');
    expect(arg.channelId).toBe('c1');
  });

  test('patches the original Discord message with the token', async () => {
    const deps = makeDeps();
    const usecase = makeRegisterBotScheduleUsecase(deps);

    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok' }),
    );
  });

  test('sends a registration confirmation message', async () => {
    const deps = makeDeps();
    const usecase = makeRegisterBotScheduleUsecase(deps);

    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    const { message } = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(message.content).toContain('Registration complete');
  });
});
