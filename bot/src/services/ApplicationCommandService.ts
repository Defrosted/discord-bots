import { Interaction, InteractionCallbackType, InteractionResponse } from '@domain/Interaction';
import { BadRequestError, NotFoundError } from '@domain/HttpErrorTypes';
import { IncomingInteractionPort } from '@ports/IncomingInteractionPort';
import { ExternalRandomResourcePort } from '@ports/ExternalResourcePort';
import { Embed } from '@domain/Embed';

export type CommandMap = Record<
  string, 
  () => Promise<InteractionResponse>
>;

export const WEDNESDAY_SLASH_COMMAND = 'itiswednesday';

export class ApplicationCommandService implements IncomingInteractionPort {
  private readonly commandMap: CommandMap;

  constructor(private randomEmbedService: ExternalRandomResourcePort<Embed>, commandMap?: CommandMap) {
    if (commandMap)
      this.commandMap = commandMap;

    this.commandMap = {
      [WEDNESDAY_SLASH_COMMAND]: this.wednesdayCommandHandler
    };
  }

  public async process(interaction: Interaction) {
    const slashCommandName = interaction.data?.name;
    if (!slashCommandName)
      throw new BadRequestError('Slash command name was undefined');

    const commandHandler = this.commandMap[slashCommandName];
    if (!commandHandler)
      throw new NotFoundError(`Unable to process slash command '${slashCommandName}'`);

    return await commandHandler();
  }

  private async wednesdayCommandHandler(): Promise<InteractionResponse> {
    const response: InteractionResponse = {
      type: InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'It is Wednesday my dudes!',
        embeds: []
      }
    };

    try {
      const embed = await this.randomEmbedService.getRandomValue();
      console.info('Embedded Reddit post', embed);

      response.data?.embeds?.push(embed);
    } catch(error) {
      console.error(error);
    }

    return response;
  }
}
