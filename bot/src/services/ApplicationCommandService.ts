import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { config } from '@config/.';
import {
  DiscordInteraction,
  DiscordInteractionCallbackType,
  DiscordInteractionResponse,
} from '@domain/DiscordInteraction';
import { BadRequestError, NotFoundError } from '@domain/HttpErrorTypes';
import {
  IncomingBotInteractionPort,
} from '@ports/IncomingPort';
import { DiscordActions } from './DiscordActionService';

export type CommandMap = Record<
  string,
  (
    interaction: DiscordInteraction
  ) => Promise<DiscordInteractionResponse>
>;

export const WEDNESDAY_SLASH_COMMAND = 'itiswednesday';

export class DiscordApplicationCommandService
  implements IncomingBotInteractionPort
{
  private readonly commandMap: CommandMap;

  constructor(
    private lambdaClient: LambdaClient,
    commandMap?: CommandMap
  ) {
    if (commandMap)
      this.commandMap = commandMap;
    else {
      this.commandMap = {
        [WEDNESDAY_SLASH_COMMAND]: this.wednesdayCommandHandler.bind(this),
      };
    }
  }

  public async process(
    interaction: DiscordInteraction
  ) {
    const slashCommandName = interaction.data?.name;
    if (!slashCommandName)
      throw new BadRequestError('Slash command name was undefined');

    const commandHandler = this.commandMap[slashCommandName];
    if (!commandHandler)
      throw new NotFoundError(
        `Unable to process slash command '${slashCommandName}'`
      );

    return await commandHandler(interaction);
  }

  private async wednesdayCommandHandler(interaction: DiscordInteraction): Promise<DiscordInteractionResponse> {
    const initialResponse: DiscordInteractionResponse = {
      type: DiscordInteractionCallbackType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'It is Wednesday my dudes!',
        embeds: [],
      },
    };

    const lambdaPayload = {
      action: DiscordActions.WednesdayMemeFollowUp,
      data: interaction
    };
    await this.lambdaClient.send(
      new InvokeCommand({
        FunctionName: config.actionLambdaFunctionName,
        InvocationType: InvocationType.Event,
        Payload: Buffer.from(JSON.stringify(lambdaPayload))
      })
    );

    return initialResponse;
  }
}
