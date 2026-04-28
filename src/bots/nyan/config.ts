import z from 'zod';

export const nyanBotConfigSchema = z.object({
  region: z.string(),
  discordApiUrl: z.string(),
  discordApplicationId: z.string(),
  discordPublicKey: z.string(),
  discordAuthToken: z.string(),
  cataasApiUrl: z.string(),
  sendCatPhotoFnName: z.string(),
});

export type NyanBotConfig = z.infer<typeof nyanBotConfigSchema>;

export const getConfig = () =>
  nyanBotConfigSchema.parse(
    Object.keys(nyanBotConfigSchema.shape).reduce<Record<string, unknown>>(
      (acc, key) => {
        acc[key] = process.env[key];
        return acc;
      },
      {},
    ),
  );
