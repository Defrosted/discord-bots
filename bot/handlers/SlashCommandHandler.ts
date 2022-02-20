import { RedditService } from '../integration/reddit/RedditService';
import { Interaction, InteractionCallbackType, InteractionResponse } from '../types/discord';
import { BaseHandler } from '../types/Handler';
import { NotFoundError } from '../types/HttpErrorTypes';

export const WEDNESDAY_SLASH_COMMAND = 'itiswednesday';

export class SlashCommandHandler extends BaseHandler {
  public static async process(interaction: Interaction) {
    const slashCommandName = interaction.data?.name;

    switch(slashCommandName) {
      case WEDNESDAY_SLASH_COMMAND:
        return await this.wednesdayCommandHandler();
      default:
        throw new NotFoundError(`Unable to process slash command '${slashCommandName}'`);
    }
  }

  private static async wednesdayCommandHandler(): Promise<InteractionResponse> {
    const response: InteractionResponse = {
      type: InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'It is Wednesday my dudes!'
      }
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const embed = await new RedditService().getRandomPostUrl();
      console.info('Embedded Reddit post', embed);

      response.data!.embeds = [ embed ];
    } catch(error) {
      console.error(error);
    }

    return response;
  }
}
