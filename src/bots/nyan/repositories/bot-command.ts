import { InvocationType } from '@aws-sdk/client-lambda';
import { LambdaClient } from '@lib/adapters/lambda-client';
import { sendCatPhotoInvocationSchema } from '@lib/schemas/events/nyan-bot';
import { DiscordInteraction } from '@lib/schemas/shared/discord';
import { makeRecordValidator } from '@lib/util/record-validator';

export interface BotCommandRepository {
  sendCatPhoto: (interaction: DiscordInteraction) => Promise<void>;
  sendCatGif: (interaction: DiscordInteraction) => Promise<void>;
}

interface Deps {
  lambdaClient: LambdaClient;
  sendCatPhotoFunctionName: string;
}

export const makeBotCommandRepository = (deps: Deps): BotCommandRepository => ({
  sendCatPhoto: async (interaction) => {
    const subCommandOptions = interaction.data?.options?.[0]?.options;
    const tagsOption = subCommandOptions?.find((o) => o.name === 'tags');
    const textOption = subCommandOptions?.find((o) => o.name === 'text');
    const Payload = makeRecordValidator(sendCatPhotoInvocationSchema)({
      token: interaction.token,
      channelId: interaction.channel_id,
      serverId: interaction.guild_id,
      tags: tagsOption?.value as string | undefined,
      text: textOption?.value as string | undefined,
    });
    await deps.lambdaClient.invoke({
      FunctionName: deps.sendCatPhotoFunctionName,
      Payload,
      InvocationType: InvocationType.Event,
    });
  },
  sendCatGif: async (interaction) => {
    const subCommandOptions = interaction.data?.options?.[0]?.options;
    const userTags = subCommandOptions?.find((o) => o.name === 'tags')?.value as string | undefined;
    const tags = userTags ? `gif,${userTags}` : 'gif';
    const textOption = subCommandOptions?.find((o) => o.name === 'text');
    const Payload = makeRecordValidator(sendCatPhotoInvocationSchema)({
      token: interaction.token,
      channelId: interaction.channel_id,
      serverId: interaction.guild_id,
      tags,
      text: textOption?.value as string | undefined,
    });
    await deps.lambdaClient.invoke({
      FunctionName: deps.sendCatPhotoFunctionName,
      Payload,
      InvocationType: InvocationType.Event,
    });
  },
});
