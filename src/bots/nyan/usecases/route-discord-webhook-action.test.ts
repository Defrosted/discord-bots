import { describe, expect, test, vi } from 'vitest';
import { DiscordInteractionType } from '@lib/constants';
import { DiscordInteractionReplyType } from '@lib/domain/discord-webhook-interaction';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { DiscordInteraction } from '@lib/schemas/shared/discord';
import { NyanCommands, NyanSubCommands } from '../constants';
import { makeRouteDiscordWebhookActionUsecase } from './route-discord-webhook-action';

const makeBotCommandRepository = () => ({
  sendCatPhoto: vi.fn().mockResolvedValue(undefined),
  sendCatGif: vi.fn().mockResolvedValue(undefined),
});

const makePingInteraction = (): DiscordInteraction => ({
  id: '1',
  type: DiscordInteractionType.PING,
  token: 'token',
});

const makeCommandInteraction = (name: string, subCommand?: string): DiscordInteraction => ({
  id: '1',
  type: DiscordInteractionType.APPLICATION_COMMAND,
  token: 'token',
  data: { name, options: subCommand ? [{ name: subCommand, type: 1 }] : [] },
});

describe('makeRouteDiscordWebhookActionUsecase', () => {
  test('returns PONG for PING interaction', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    const result = await usecase(makePingInteraction());

    expect(result.type).toBe(DiscordInteractionReplyType.PONG);
    expect(botCommandRepository.sendCatPhoto).not.toHaveBeenCalled();
  });

  test('invokes sendCatPhoto and returns deferred reply for cat photo subcommand', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    const result = await usecase(makeCommandInteraction(NyanCommands.CAT, NyanSubCommands.IMAGE));

    expect(botCommandRepository.sendCatPhoto).toHaveBeenCalledTimes(1);
    expect(result.type).toBe(DiscordInteractionReplyType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  });

  test('passes the full interaction to sendCatPhoto', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });
    const interaction = makeCommandInteraction(NyanCommands.CAT, NyanSubCommands.IMAGE);

    await usecase(interaction);

    expect(botCommandRepository.sendCatPhoto).toHaveBeenCalledWith(interaction);
  });

  test('invokes sendCatGif and returns deferred reply for cat gif subcommand', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    const result = await usecase(makeCommandInteraction(NyanCommands.CAT, NyanSubCommands.GIF));

    expect(botCommandRepository.sendCatGif).toHaveBeenCalledTimes(1);
    expect(result.type).toBe(DiscordInteractionReplyType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  });

  test('passes the full interaction to sendCatGif', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });
    const interaction = makeCommandInteraction(NyanCommands.CAT, NyanSubCommands.GIF);

    await usecase(interaction);

    expect(botCommandRepository.sendCatGif).toHaveBeenCalledWith(interaction);
  });

  test('throws CommandNotFoundError for an unrecognised command', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    await expect(usecase(makeCommandInteraction('unknown'))).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.CommandNotFoundError }),
    );
  });

  test('throws BotError for an unrecognised command', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    await expect(usecase(makeCommandInteraction('unknown'))).rejects.toBeInstanceOf(BotError);
  });
});
