import { Interaction, InteractionResponse } from '@domain/Interaction';

export interface IncomingInteractionPort {
  process: (interaction: Interaction) => Promise<InteractionResponse>;
}
