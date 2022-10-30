import { AwsDynamoDbAdapter } from '@adapters/AwsDynamoDbAdapter';
import { DiscordRequestAdapter } from '@adapters/DiscordRequestAdapter';
import { DiscordInteraction } from '@domain/DiscordInteraction';
import { DiscordWebhookMessage } from '@domain/DiscordWebhookMessage';
import { Embed } from '@domain/Embed';
import { NotFoundError } from '@domain/HttpErrorTypes';
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
    private randomEmbedService: ExternalRandomResourcePort<Embed>,
    private discordRequestAdapter: DiscordRequestAdapter<any>,
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

  public async sendWednesdayMemeFollowUp(
    interaction: DiscordInteraction
  ): Promise<void> {
    try {
      // Get an embed
      console.info('Fetching random embed');
      const embed = await this.randomEmbedService.getRandomValue();
      if (!embed?.url) {
        throw new Error('Failed to get an embed with an image');
      }

      const webhookMessage: DiscordWebhookMessage = {
        content: 'It is Wednesday my dudes!',
        embeds: [
          {
            ...embed,
            image: {
              url: embed.url,
            },
          },
        ],
      };

      const result = await this.discordRequestAdapter.sendRequest(
        'patch',
        `webhooks/${this.applicationId}/${interaction.token}/messages/@original`,
        webhookMessage
      );
      console.debug('Discord result', result);
    } catch (error) {
      console.error('Failed to fetch an wednesday meme embed', error);
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

      if (!memeEmbed?.url) {
        throw new Error('Failed to get an embed with an image');
      }

      const message: DiscordWebhookMessage = {
        content: 'It is Wednesday my dudes!',
        embeds: [
          {
            ...memeEmbed,
            image: {
              url: memeEmbed.url,
            },
          },
        ],
      };

      if(!guilds)
        throw new Error('No guilds with registered schedule');
      await Promise.all(
        guilds.map(({ channel_id }) =>
          this.discordRequestAdapter.sendRequest(
            'post',
            `channels/${channel_id}/messages`,
            message,
            undefined,
            this.token
          )
        )
      );
    } catch (error) {
      console.error('Failed to send scheduled wednesday memes', error);
    }
  }
}
