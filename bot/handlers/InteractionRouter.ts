import { Interaction, InteractionCallbackType, InteractionResponse, InteractionType } from '../types/discord';
import { BadRequestError } from '../types/HttpErrorTypes';
import { SlashCommandHandler } from './SlashCommandHandler';

export class InteractionRouter {
  public static async routeInteraction (
    interaction: Interaction
  ): Promise<InteractionResponse> {
    console.info('Received interaction', interaction);

    switch (interaction.type) {
      case InteractionType.PING:
        return {
          type: InteractionCallbackType.PONG
        };
      case InteractionType.APPLICATION_COMMAND:
        return await SlashCommandHandler.process(interaction);
      default:
        throw new BadRequestError('Unknown interaction');
    }
  }
}
