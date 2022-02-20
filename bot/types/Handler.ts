import { Interaction, InteractionResponse } from './discord';

export abstract class BaseHandler {
  public static process: (interaction: Interaction) => Promise<InteractionResponse>;
}
