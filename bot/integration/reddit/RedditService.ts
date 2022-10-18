import axios from 'axios';
import { DateTime } from 'luxon';
import { SSMManager } from '../aws/SSMManager';
import { URLSearchParams } from 'url';

const redditAuthUrl = 'https://www.reddit.com/api/v1/access_token';
const redditApiBaseUrl = 'https://oauth.reddit.com';

interface RedditAuthResponse {
  'access_token': string;
  'expires_in': number;
}

interface RedditListingResponse {
  kind: string;
  data: {
    children: RedditListingDataChildren[];
  };
}

interface RedditListingDataChildren {
  kind: string;
  data: {
    url?: string;
    title: string;
  }
}

export class RedditService {
  private token?: string;
  private tokenExpiration?: DateTime;

  private async authenticate() {
    const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET } = process.env;
    const [ clientId, clientSecret ] = await Promise.all([
      new SSMManager().getParameterValue(REDDIT_CLIENT_ID),
      new SSMManager().getParameterValue(REDDIT_CLIENT_SECRET)
    ]);

    const authString = `${clientId}:${clientSecret}`;

    try {
      const authResponse = await axios.post<RedditAuthResponse>(redditAuthUrl, new URLSearchParams({
        'grant_type': 'client_credentials'
      }), {
        headers: {
          'Authorization': `Basic ${Buffer.from(authString).toString('base64')}`,
          'User-Agent': 'Wednesday Bot by Lambda256'
        }
      });

      const { access_token, expires_in } = authResponse.data;
      this.token = access_token;
      this.tokenExpiration = DateTime.now().plus({ seconds: expires_in });

      console.info('Fetched Reddit token', authResponse.data);

      return this.token;
    } catch(error) {
      console.error('Failed to authenticate to Reddit', error);
      throw error;
    }
  }

  public async getRandomPostUrl() {
    if(!this.token || !this.tokenExpiration || DateTime.now().diff(this.tokenExpiration)) {
      this.token = await this.authenticate();
    }

    const response = await axios.get<RedditListingResponse[]>(`${redditApiBaseUrl}/r/ItIsWednesday/random`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'User-Agent': 'Wednesday Bot by Lambda256'
      }
    });

    const { url, title } = response.data
      .map(value => value.data.children)
      .flat()
      .filter(listing => listing.kind === 't3')[0].data; // Filter top level posts only and pick first index data

    return {
      title,
      url,
      description: title
    };
  }
}