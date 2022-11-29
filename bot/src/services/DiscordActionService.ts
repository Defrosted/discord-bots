import { AwsDynamoDbAdapter } from '@adapters/AwsDynamoDbAdapter';
import { DiscordRequestAdapter } from '@adapters/DiscordRequestAdapter';
import { DiscordInteraction } from '@domain/DiscordInteraction';
import { DiscordWebhookMessage } from '@domain/DiscordWebhookMessage';
import { NotFoundError } from '@domain/HttpErrorTypes';
import { RedditEmbed } from '@domain/RedditApi';
import { ActionPort } from '@ports/ActionPort';
import { ExternalRandomResourcePort } from '@ports/ExternalPort';

export enum DiscordActions {
  WednesdayMemeFollowUp = 'sendWednesdayMemeFollowUp',
  WednesdayRegistrationFollowUp = 'makeWednesdayRegistrationAndSendFollowUp',
  WednesdayDeregistrationFollowUp = 'deregisterWednesdayRegistrationAndSendFollowUp',
  ScheduledWednesdayMeme = 'sendScheduledWednesdayMeme',
}

export interface DynamoDBRegistrationSchema {
  guild_id: string;
  channel_id: string;
}

export class DiscordActionService implements ActionPort<DiscordActions> {
  constructor(
    private applicationId: string,
    private token: string,
    private randomEmbedService: ExternalRandomResourcePort<RedditEmbed>,
    private discordRequestAdapter: DiscordRequestAdapter,
    private dynamodbAdapter: AwsDynamoDbAdapter<DynamoDBRegistrationSchema>
  ) {}

  public performAction(action: string, data: unknown) {
    switch (action) {
      case DiscordActions.WednesdayMemeFollowUp:
        return this.sendWednesdayMemeFollowUp(data as DiscordInteraction);
      case DiscordActions.WednesdayRegistrationFollowUp:
        return this.makeWednesdayRegistrationAndSendFollowUp(
          data as DiscordInteraction
        );
      case DiscordActions.WednesdayDeregistrationFollowUp:
        return this.deregisterWednesdayRegistrationAndSendFollowUp(
          data as DiscordInteraction
        );
      case DiscordActions.ScheduledWednesdayMeme:
        return this.sendScheduledWednesdayMeme();
      default:
        throw new NotFoundError(`Unknown action '${action}'`);
    }
  }

  public static buildWebhookMessage(content: string, embed: RedditEmbed): DiscordWebhookMessage {
    const { title, description, url, isVideo } = embed;
    if (!url) {
      throw new Error('Embed does not have an url');
    }

    const message: DiscordWebhookMessage = {
      content,
    };

    if(isVideo) {
      message.content += ` ${url}`;
    } else {
      message.embeds = [
        {
          title,
          description,
          url,
          image: {
            url,
          },
        },
      ];
    }

    console.debug('Discord webhook message', message);
    return message;
  }

  public async sendWednesdayMemeFollowUp(
    interaction: DiscordInteraction
  ): Promise<void> {
    try {
      // Get an embed
      console.info('Fetching random embed');
      const embed = await this.randomEmbedService.getRandomValue();
      const result = await this.discordRequestAdapter.sendRequest(
        'patch',
        `webhooks/${this.applicationId}/${interaction.token}/messages/@original`,
        DiscordActionService.buildWebhookMessage('It is Wednesday my dudes!', embed)
      );
      console.debug('Discord result', result);
    } catch (error) {
      console.error('Failed to fetch and post an wednesday meme embed', error);
    }
  }

  public async makeWednesdayRegistrationAndSendFollowUp(
    interaction: DiscordInteraction
  ) {
    try {
      await this.dynamodbAdapter.putValue({
        primaryKeyName: 'guild_id',
        primaryKeyValue: interaction.guild_id,
        sortKeyName: 'channel_id',
        sortKeyValue: interaction.channel_id,
      });

      const message: DiscordWebhookMessage = {
        content: 'Registration complete!',
      };

      const result = await this.discordRequestAdapter.sendRequest(
        'patch',
        `webhooks/${this.applicationId}/${interaction.token}/messages/@original`,
        message
      );
      console.debug('Discord result', result);
    } catch (error) {
      console.error('Failed to make Discord registration', error);
    }
  }

  public async deregisterWednesdayRegistrationAndSendFollowUp(
    interaction: DiscordInteraction
  ) {
    try {
      await this.dynamodbAdapter.deleteValue({
        primaryKeyName: 'guild_id',
        primaryKeyValue: interaction.guild_id,
        sortKeyName: 'channel_id',
        sortKeyValue: interaction.channel_id,
      });

      const message: DiscordWebhookMessage = {
        content: 'Deregistered successfully from scheduled wednesday memes',
      };

      const result = await this.discordRequestAdapter.sendRequest(
        'patch',
        `webhooks/${this.applicationId}/${interaction.token}/messages/@original`,
        message
      );
      console.debug('Discord result', result);
    } catch (error) {
      console.error('Failed to make Discord registration', error);
    }
  }

  public async sendScheduledWednesdayMeme() {
    try {
      const memePromise = this.randomEmbedService.getRandomValue();
      const scheduledServers = this.dynamodbAdapter.getAllValues();
      const [memeEmbed, guilds] = await Promise.all([
        memePromise,
        scheduledServers,
      ]);

      await Promise.all(
        guilds?.map(({ channel_id }) =>
          this.discordRequestAdapter.sendRequest(
            'post',
            `channels/${channel_id}/messages`,
            DiscordActionService.buildWebhookMessage('It is Wednesday my dudes!', memeEmbed),
            undefined,
            this.token
          )
        ) ?? []
      );
    } catch (error) {
      console.error('Failed to send scheduled wednesday memes', error);
    }
  }
}
