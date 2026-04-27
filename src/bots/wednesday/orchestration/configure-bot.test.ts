import { describe, expect, test, vi } from 'vitest';
import { BotErrorType } from '@lib/errors/bot-error';
import { WednesdayConfigureSubCommands } from '../constants';
import { makeConfigureBotUsecase } from './configure-bot';

const makeRegisterBotSchedule = () => vi.fn().mockResolvedValue(undefined);
const makeDeleteBotRegistration = () => vi.fn().mockResolvedValue(undefined);

const makeParams = (subCommand: string) => ({
  serverId: 's1',
  channelId: 'c1',
  token: 'tok',
  options: [{ name: subCommand, type: 1, options: [] }],
});

describe('makeConfigureBotUsecase', () => {
  test('calls registerBotSchedule for the register sub-command', async () => {
    const registerBotSchedule = makeRegisterBotSchedule();
    const deleteBotRegistration = makeDeleteBotRegistration();
    const usecase = makeConfigureBotUsecase({ registerBotSchedule, deleteBotRegistration });

    await usecase(makeParams(WednesdayConfigureSubCommands.REGISTER));

    expect(registerBotSchedule).toHaveBeenCalledTimes(1);
    expect(deleteBotRegistration).not.toHaveBeenCalled();
  });

  test('calls deleteBotRegistration for the deregister sub-command', async () => {
    const registerBotSchedule = makeRegisterBotSchedule();
    const deleteBotRegistration = makeDeleteBotRegistration();
    const usecase = makeConfigureBotUsecase({ registerBotSchedule, deleteBotRegistration });

    await usecase(makeParams(WednesdayConfigureSubCommands.DEREGISTER));

    expect(deleteBotRegistration).toHaveBeenCalledTimes(1);
    expect(registerBotSchedule).not.toHaveBeenCalled();
  });

  test('passes full params to the sub-command handler', async () => {
    const registerBotSchedule = makeRegisterBotSchedule();
    const usecase = makeConfigureBotUsecase({
      registerBotSchedule,
      deleteBotRegistration: makeDeleteBotRegistration(),
    });
    const params = makeParams(WednesdayConfigureSubCommands.REGISTER);

    await usecase(params);

    expect(registerBotSchedule).toHaveBeenCalledWith(params);
  });

  test('throws InvalidInputError when options array is empty', () => {
    const usecase = makeConfigureBotUsecase({
      registerBotSchedule: makeRegisterBotSchedule(),
      deleteBotRegistration: makeDeleteBotRegistration(),
    });

    expect(() =>
      usecase({ serverId: 's1', channelId: 'c1', token: 'tok', options: [] }),
    ).toThrow(expect.objectContaining({ errorType: BotErrorType.InvalidInputError }));
  });

  test('throws CommandNotFoundError for an unknown sub-command', () => {
    const usecase = makeConfigureBotUsecase({
      registerBotSchedule: makeRegisterBotSchedule(),
      deleteBotRegistration: makeDeleteBotRegistration(),
    });

    expect(() => usecase(makeParams('unknown'))).toThrow(
      expect.objectContaining({ errorType: BotErrorType.CommandNotFoundError }),
    );
  });
});
