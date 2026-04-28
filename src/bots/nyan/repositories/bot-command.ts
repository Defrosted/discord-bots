import { InvocationType } from '@aws-sdk/client-lambda';
import { LambdaClient } from '@lib/adapters/lambda-client';
import { sendCatPhotoInvocationSchema } from '@lib/schemas/events/nyan-bot';
import { DiscordInteraction } from '@lib/schemas/shared/discord';
import { makeRecordValidator } from '@lib/util/record-validator';

export interface BotCommandRepository {
  sendCatPhoto: (interaction: DiscordInteraction) => Promise<void>;
}

interface Deps {
  lambdaClient: LambdaClient;
  sendCatPhotoFunctionName: string;
}

export const makeBotCommandRepository = (deps: Deps): BotCommandRepository => ({
  sendCatPhoto: async (interaction) => {
    const tagsOption = interaction.data?.options?.find((o) => o.name === 'tags');
    const Payload = makeRecordValidator(sendCatPhotoInvocationSchema)({
      token: interaction.token,
      channelId: interaction.channel_id,
      serverId: interaction.guild_id,
      tags: tagsOption?.value as string | undefined,
    });
    await deps.lambdaClient.invoke({
      FunctionName: deps.sendCatPhotoFunctionName,
      Payload,
      InvocationType: InvocationType.Event,
    });
  },
});
