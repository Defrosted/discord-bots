import { describe, expect, test, vi } from 'vitest';
import { DiscordInteractionType } from '@lib/constants';
import { DiscordInteractionReplyType } from '@lib/domain/discord-webhook-interaction';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { DiscordInteraction } from '@lib/schemas/shared/discord';
import { WednesdayCommands } from '../constants';
import { makeRouteDiscordWebhookActionUsecase } from './route-discord-webhook-action';

const makeBotCommandRepository = () => ({
  sendWednesdayMeme: vi.fn().mockResolvedValue(undefined),
  configureBot: vi.fn().mockResolvedValue(undefined),
});

const makePingInteraction = (): DiscordInteraction => ({
  id: '1',
  type: DiscordInteractionType.PING,
  token: 'token',
});

const makeCommandInteraction = (name: string): DiscordInteraction => ({
  id: '1',
  type: DiscordInteractionType.APPLICATION_COMMAND,
  token: 'token',
  data: { name, options: [] },
});

describe('makeRouteDiscordWebhookActionUsecase', () => {
  test('returns PONG reply for PING interaction', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    const result = await usecase(makePingInteraction());

    expect(result.type).toBe(DiscordInteractionReplyType.PONG);
    expect(botCommandRepository.sendWednesdayMeme).not.toHaveBeenCalled();
    expect(botCommandRepository.configureBot).not.toHaveBeenCalled();
  });

  test('invokes sendWednesdayMeme and returns deferred reply for itiswednesday command', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    const result = await usecase(makeCommandInteraction(WednesdayCommands.WEDNESDAY_MEME));

    expect(botCommandRepository.sendWednesdayMeme).toHaveBeenCalledTimes(1);
    expect(result.type).toBe(DiscordInteractionReplyType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  });

  test('invokes configureBot and returns deferred reply for wednesday command', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    const result = await usecase(makeCommandInteraction(WednesdayCommands.CONFIGURE_BOT_ROOT));

    expect(botCommandRepository.configureBot).toHaveBeenCalledTimes(1);
    expect(result.type).toBe(DiscordInteractionReplyType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  });

  test('passes the full interaction to sendWednesdayMeme', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });
    const interaction = makeCommandInteraction(WednesdayCommands.WEDNESDAY_MEME);

    await usecase(interaction);

    expect(botCommandRepository.sendWednesdayMeme).toHaveBeenCalledWith(interaction);
  });

  test('throws CommandNotFoundError for an unrecognised command', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    await expect(usecase(makeCommandInteraction('unknown_command'))).rejects.toThrow(
      expect.objectContaining({ errorType: BotErrorType.CommandNotFoundError }),
    );
  });

  test('throws BotError for unrecognised command', async () => {
    const botCommandRepository = makeBotCommandRepository();
    const usecase = makeRouteDiscordWebhookActionUsecase({ botCommandRepository });

    await expect(usecase(makeCommandInteraction('unknown_command'))).rejects.toBeInstanceOf(
      BotError,
    );
  });
});
