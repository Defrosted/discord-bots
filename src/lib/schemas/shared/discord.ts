import { DiscordInteractionType } from '@lib/constants';
import { z } from 'zod';

const baseInteractionOptionSchema = z.object({
  name: z.string(),
  type: z.number(),
});

export const discordInteractionOptionSchema: z.ZodType<DiscordInteractionOption> =
  baseInteractionOptionSchema.extend({
    options: z.lazy(() => discordInteractionOptionSchema.array()),
  });

export type DiscordInteractionOption = z.infer<
  typeof baseInteractionOptionSchema
> & {
  options: DiscordInteractionOption[];
};

export const discordInteractionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(DiscordInteractionType),
  guild_id: z.string().optional(),
  channel_id: z.string().optional(),
  token: z.string(),
  data: z
    .object({
      name: z.string(),
      options: z.array(discordInteractionOptionSchema).optional(),
    })
    .optional(),
});

export type DiscordInteraction = z.infer<typeof discordInteractionSchema>;
