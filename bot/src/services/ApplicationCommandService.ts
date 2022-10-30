import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
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

export enum SLASH_COMMANDS {
  WEDNESDAY_MEME = 'itiswednesday',
  WEDNESDAY_REGISTER = 'wednesday'
}

export enum REGISTER_COMMANDS {
  REGISTER = 'register',
  DEREGISTER = 'deregister'
}

export class DiscordApplicationCommandService
  implements IncomingBotInteractionPort
{
  private readonly commandMap: CommandMap;

  constructor(
    private lambdaClient: LambdaClient,
    private lambdaName: string,
    commandMap?: CommandMap
  ) {
    if (commandMap)
      this.commandMap = commandMap;
    else {
      this.commandMap = {
        [SLASH_COMMANDS.WEDNESDAY_MEME]: this.wednesdayCommandHandler.bind(this),
        [SLASH_COMMANDS.WEDNESDAY_REGISTER]: this.registrationCommandHandler.bind(this)
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
        FunctionName: this.lambdaName,
        InvocationType: InvocationType.Event,
        Payload: Buffer.from(JSON.stringify(lambdaPayload))
      })
    );

    return initialResponse;
  }

  private async registrationCommandHandler(interaction: DiscordInteraction): Promise<DiscordInteractionResponse> {
    const subCommandName = interaction.data?.options?.shift()?.name;
    if (!subCommandName || (subCommandName !== REGISTER_COMMANDS.REGISTER && subCommandName !== REGISTER_COMMANDS.DEREGISTER))
      throw new Error('Unknown subcommand');
    const isRegistration = subCommandName === REGISTER_COMMANDS.REGISTER;

    const initialResponse: DiscordInteractionResponse = {
      type: DiscordInteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Processing ${isRegistration ? 'registration' : 'deregistration'}...`
      }
    };

    const lambdaPayload = {
      action: isRegistration ? DiscordActions.WednesdayRegistrationFollowUp : DiscordActions.WednesdayDeregistrationFollowUp,
      data: interaction
    };
    await this.lambdaClient.send(
      new InvokeCommand({
        FunctionName: this.lambdaName,
        InvocationType: InvocationType.Event,
        Payload: Buffer.from(JSON.stringify(lambdaPayload))
      })
    );

    return initialResponse;
  }
}
