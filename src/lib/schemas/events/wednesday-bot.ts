import { z } from 'zod';
import { discordInteractionOptionSchema } from '../shared/discord';

export const configureBotInvocationSchema = z.object({
  serverId: z.string(),
  channelId: z.string(),
  token: z.string(),
  options: z.array(discordInteractionOptionSchema),
});

export type ConfigureBotInvocation = z.infer<
  typeof configureBotInvocationSchema
>;

export const sendWednesdayMemeInvocationSchema = z
  .object({
    serverId: z.string(),
    channelId: z.string(),
    token: z.string(),
  })
  .or(z.object({}));

export type SendWednesdayMemeInvocation = z.infer<
  typeof sendWednesdayMemeInvocationSchema
>;
