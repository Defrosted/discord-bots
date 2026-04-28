import { z } from 'zod';

export const sendCatPhotoInvocationSchema = z.object({
  token: z.string(),
  channelId: z.string(),
  serverId: z.string().optional(),
  tags: z.string().optional(),
});

export type SendCatPhotoInvocation = z.infer<typeof sendCatPhotoInvocationSchema>;
