import { Interaction, InteractionCallbackType, InteractionResponse, InteractionType } from '@domain/Interaction';
import { BadRequestError } from '@domain/HttpErrorTypes';
import { IncomingInteractionPort } from '@ports/IncomingInteractionPort';

export class InteractionService implements IncomingInteractionPort {
  constructor(
    private applicationCommandService: IncomingInteractionPort
  ) {}

  public async process (
    interaction: Interaction
  ): Promise<InteractionResponse> {
    console.info('Received interaction', interaction);

    switch (interaction.type) {
      case InteractionType.PING:
        return {
          type: InteractionCallbackType.PONG
        };
      case InteractionType.APPLICATION_COMMAND:
        return await this.applicationCommandService.process(interaction);
      default:
        throw new BadRequestError('Unknown interaction');
    }
  }
}
