import { OAuthClient } from '@lib/adapters/oauth-client';
import { RedditEmbed, RedditPostWithUrl } from '@lib/domain/reddit-embed';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import {
  RedditListingResponse,
  RedditRandomListing,
  redditListingResponseSchema,
  redditRandomListingSchema,
} from '@lib/schemas/shared/reddit';
import logger from '@lib/util/logger';
import { makeRecordValidator } from '@lib/util/record-validator';
import { z } from 'zod';

interface Deps {
  oauthClient: OAuthClient;
  apiUrl: string;
}

export interface RedditApiRepository {
  getFirstTopLevelPostEmbed: () => Promise<RedditEmbed>;
  getRandomPostEmbed: () => Promise<RedditEmbed>;
}

export const makeRedditApiRepository = (deps: Deps): RedditApiRepository => ({
  getFirstTopLevelPostEmbed: async () => {
    const response = await deps.oauthClient.get<RedditRandomListing[]>(
      `${deps.apiUrl}/random`,
      {},
    );

    const posts = makeRecordValidator(z.array(redditRandomListingSchema))(
      response.map((listing) => ({
        ...listing,
        data: {
          ...listing?.data,
          children: listing?.data?.children?.filter(
            (post) => post?.kind === 't3' && !!post?.data?.url,
          ),
        },
      })),
    );

    // Pick the first post available
    const post = posts
      .map((post) => post.data.children)
      .flat()
      .shift();

    if (!post) {
      throw new BotError(BotErrorType.RandomRedditPostNotFoundError);
    }

    logger.info('Post', post);

    return RedditEmbed.fromPost(post as RedditPostWithUrl);
  },
  getRandomPostEmbed: async () => {
    const response = await deps.oauthClient.get<RedditListingResponse>(
      `${deps.apiUrl}/top?limit=100&t=all`,
      {},
    );

    const listing = makeRecordValidator(redditListingResponseSchema)({
      ...response,
      data: {
        ...response.data,
        children: response.data.children.filter(
          (post) => post?.kind === 't3' && !!post?.data?.url,
        ),
      },
    });

    // Pick the first post available
    const posts = listing.data.children;
    logger.info(`Fetched ${posts.length} posts from Reddit`);

    const post = posts[Math.floor(Math.random() * posts.length)];

    if (!post) {
      throw new BotError(BotErrorType.RandomRedditPostNotFoundError);
    }

    logger.info('Post', post);

    return RedditEmbed.fromPost(post as RedditPostWithUrl);
  },
});
