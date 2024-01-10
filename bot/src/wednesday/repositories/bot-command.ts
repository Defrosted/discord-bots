import { InvocationType } from '@aws-sdk/client-lambda';
import { LambdaClient } from '@lib/adapters/lambda-client';
import {
  ConfigureBotInvocation,
  configureBotInvocationSchema,
  sendWednesdayMemeInvocationSchema,
} from '@lib/schemas/events/wednesday-bot';
import { DiscordInteraction } from '@lib/schemas/shared/discord';
import { makeRecordValidator } from '@lib/util/record-validator';

export interface BotCommandRepository {
  sendWednesdayMeme: (interaction: DiscordInteraction) => Promise<void>;
  configureBot: (interaction: DiscordInteraction) => Promise<void>;
}

interface Deps {
  lambdaClient: LambdaClient;
  sendWednesdayMemeFunctionName: string;
  configureWednesdayFunctionName: string;
}

export const makeBotCommandRepository = (deps: Deps): BotCommandRepository => ({
  sendWednesdayMeme: async (interaction) => {
    const Payload = makeRecordValidator(sendWednesdayMemeInvocationSchema)({
      serverId: interaction.guild_id,
      channelId: interaction.channel_id,
      token: interaction.token,
    });
    await deps.lambdaClient.invoke({
      FunctionName: deps.sendWednesdayMemeFunctionName,
      Payload,
      InvocationType: InvocationType.Event,
    });
  },
  configureBot: async (interaction) => {
    const Payload = makeRecordValidator(configureBotInvocationSchema)({
      serverId: interaction.guild_id,
      channelId: interaction.channel_id,
      token: interaction.token,
      options: interaction.data?.options,
    });

    await deps.lambdaClient.invoke<ConfigureBotInvocation>({
      FunctionName: deps.configureWednesdayFunctionName,
      Payload,
      InvocationType: InvocationType.Event,
    });
  },
});
