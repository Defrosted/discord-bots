import { DiscordInteraction, DiscordInteractionCallbackType, DiscordInteractionResponse, DiscordInteractionType } from '@domain/DiscordInteraction';
import { BadRequestError } from '@domain/HttpErrorTypes';
import { IncomingBotInteractionPort } from '@ports/IncomingPort';

export class InteractionService implements IncomingBotInteractionPort {
  constructor(
    private applicationCommandService: IncomingBotInteractionPort
  ) {}

  public async process (
    interaction: DiscordInteraction,
  ): Promise<DiscordInteractionResponse> {
    console.info('Received interaction', interaction);

    switch (interaction.type) {
      case DiscordInteractionType.PING:
        return {
          type: DiscordInteractionCallbackType.PONG
        };
        break;
      case DiscordInteractionType.APPLICATION_COMMAND:
        return await this.applicationCommandService.process(interaction);
        break;
      default:
        throw new BadRequestError('Unknown interaction');
    }
  }
}
