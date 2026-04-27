import { describe, expect, test, vi } from 'vitest';
import { makeDeleteBotRegistrationUsecase } from './delete-bot-registration';

const makeDeps = () => ({
  botConfigurationRepository: {
    getAll: vi.fn(),
    put: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  discordApiRepository: {
    patchOriginalMessage: vi.fn().mockResolvedValue(undefined),
    postMessageToChannel: vi.fn(),
  },
});

describe('makeDeleteBotRegistrationUsecase', () => {
  test('deletes the bot configuration from the repository', async () => {
    const deps = makeDeps();
    const usecase = makeDeleteBotRegistrationUsecase(deps);

    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    expect(deps.botConfigurationRepository.delete).toHaveBeenCalledTimes(1);
    expect(deps.botConfigurationRepository.delete).toHaveBeenCalledWith(
      expect.objectContaining({ serverId: 's1', channelId: 'c1' }),
    );
  });

  test('patches the original Discord message with the token', async () => {
    const deps = makeDeps();
    const usecase = makeDeleteBotRegistrationUsecase(deps);

    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    expect(deps.discordApiRepository.patchOriginalMessage).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok' }),
    );
  });

  test('sends a deletion confirmation message', async () => {
    const deps = makeDeps();
    const usecase = makeDeleteBotRegistrationUsecase(deps);

    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    const { message } = deps.discordApiRepository.patchOriginalMessage.mock.calls[0][0];
    expect(message.content).toContain('deleted');
  });

  test('deletes the configuration before patching the message', async () => {
    const callOrder: string[] = [];
    const deps = makeDeps();
    deps.botConfigurationRepository.delete.mockImplementation(async () => {
      callOrder.push('delete');
    });
    deps.discordApiRepository.patchOriginalMessage.mockImplementation(async () => {
      callOrder.push('patch');
    });

    const usecase = makeDeleteBotRegistrationUsecase(deps);
    await usecase({ serverId: 's1', channelId: 'c1', token: 'tok' });

    expect(callOrder).toEqual(['delete', 'patch']);
  });
});
