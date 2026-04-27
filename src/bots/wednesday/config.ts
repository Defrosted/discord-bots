import z from 'zod';

export const wednesdayBotConfigSchema = z.object({
  region: z.string(),
  discordApiUrl: z.string(),
  discordApplicationId: z.string(),
  discordPublicKey: z.string(),
  discordAuthToken: z.string(),
  botConfigurationTableName: z.string(),
  redditClientId: z.string(),
  redditClientSecret: z.string(),
  redditAuthUrl: z.string(),
  redditApiUrl: z.string(),
  redditUserAgent: z.string(),
  sendWednesdayMemeFnName: z.string(),
  configureWednesdayFnName: z.string(),
});

export type WednesdayBotConfig = z.infer<typeof wednesdayBotConfigSchema>;

export const getConfig = () =>
  wednesdayBotConfigSchema.parse(
    Object.keys(wednesdayBotConfigSchema.shape).reduce<Record<string, unknown>>(
      (acc, key) => {
        acc[key] = process.env[key];
        return acc;
      },
      {},
    ),
  );
