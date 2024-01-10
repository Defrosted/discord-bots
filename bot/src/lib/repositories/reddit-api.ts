import { OAuthClient } from '@lib/adapters/oauth-client';
import { RedditEmbed, RedditPostWithUrl } from '@lib/domain/reddit-embed';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import {
  RedditListingResponse,
  redditListingResponseSchema,
} from '@lib/schemas/shared/reddit';
import { makeRecordValidator } from '@lib/util/record-validator';

interface Deps {
  oauthClient: OAuthClient;
  apiUrl: string;
}

export interface RedditApiRepository {
  getFirstTopLevelPostEmbed: () => Promise<RedditEmbed>;
}

export const makeRedditApiRepository = (deps: Deps): RedditApiRepository => ({
  getFirstTopLevelPostEmbed: async () => {
    const response = await deps.oauthClient.get<RedditListingResponse>(
      deps.apiUrl,
      {},
    );

    const posts = makeRecordValidator(redditListingResponseSchema)(
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

    console.log('Post', post);

    return RedditEmbed.fromPost(post as RedditPostWithUrl);
  },
});
