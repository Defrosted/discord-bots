import axios from 'axios';
import { DateTime } from 'luxon';
import { URLSearchParams } from 'url';
import { ExternalRandomResourcePort } from '@ports/ExternalResourcePort';
import { Embed } from '@domain/Embed';
import { ExternalAuthenticatedAPIPort } from '@ports/ExternalAuthenticatedAPIPort';
import { RedditAuthResponse, RedditListingResponse } from '@domain/RedditApi';

const redditAuthUrl = 'https://www.reddit.com/api/v1/access_token';
const redditApiBaseUrl = 'https://oauth.reddit.com';

export class RedditService implements ExternalAuthenticatedAPIPort, ExternalRandomResourcePort<Embed> {
  private token?: string;
  private tokenExpiration?: DateTime;
  private tokenPromise: Promise<void>;

  constructor(private clientId: string, private clientSecret: string) {
    this.tokenPromise = this.authenticate();
  }

  public tokenIsValid() {
    return !!this.token && !!this.tokenExpiration && this.tokenExpiration.toMillis() > DateTime.now().toMillis();
  }

  public async authenticate() {
    if (this.tokenIsValid())
      return;

    const authString = `${this.clientId}:${this.clientSecret}`;

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
    } catch(error) {
      console.error('Failed to authenticate to Reddit', error);
      throw error;
    }
  }

  public async getRandomValue() {
    await this.tokenPromise; // Prevent multiple simultaneous authentications
    if(!this.tokenIsValid()) {
      await (this.tokenPromise = this.authenticate());
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