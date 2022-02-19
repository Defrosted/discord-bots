import { Interaction, InteractionType } from '../types/discord';
import { BadRequestError } from '../types/HttpErrorTypes';

export class InteractionRouter {
  public static routeInteraction = (
    interaction: Interaction
  ): Record<string, unknown> => {
    console.debug('Received interaction', interaction);

    switch (interaction.type) {
      case InteractionType.PING:
        return {
          type: InteractionType.PING
        };
      default:
        throw new BadRequestError('Unknown interaction');
    }
  };
}
