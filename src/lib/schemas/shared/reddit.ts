import { z } from 'zod';

export const redditAuthResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

export type RedditAuthResponse = z.infer<typeof redditAuthResponseSchema>;

export const redditPostSchema = z.object({
  kind: z.string(),
  data: z.object({
    url: z.string().optional(),
    title: z.string(),
    is_video: z.boolean().optional().default(false),
  }),
});
export type RedditPost = z.infer<typeof redditPostSchema>;

export const redditRandomListingSchema = z.object({
  kind: z.string(),
  data: z.object({
    children: z.array(redditPostSchema),
  }),
});
export type RedditRandomListing = z.infer<typeof redditRandomListingSchema>;

export const redditListingResponseSchema = redditRandomListingSchema.extend({
  data: z.object({
    children: z.array(redditPostSchema),
  }),
});

export type RedditListingResponse = z.infer<typeof redditListingResponseSchema>;
