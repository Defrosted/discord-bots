import { DiscordRequestAdapter } from '@adapters/DiscordRequestAdapter';
import { DiscordInteraction } from '@domain/DiscordInteraction';
import { DiscordWebhookMessage } from '@domain/DiscordWebhookMessage';
import { Embed } from '@domain/Embed';
import { NotFoundError } from '@domain/HttpErrorTypes';
import { ActionPort } from '@ports/ActionPort';
import { ExternalRandomResourcePort } from '@ports/ExternalPort';

//export type DiscordActions = 'sendWednesdayMemeFollowUp'
export enum DiscordActions {
  WednesdayMemeFollowUp = 'sendWednesdayMemeFollowUp'
}

export class DiscordActionService implements ActionPort<DiscordActions> {
  constructor(private randomEmbedService: ExternalRandomResourcePort<Embed>, private discordRequestAdapter: DiscordRequestAdapter<any>) {}

  public performAction(action: string, data: unknown) {
    switch(action) {
      case DiscordActions.WednesdayMemeFollowUp:
        return this.sendWednesdayMemeFollowUp(data as DiscordInteraction);
      default:
        throw new NotFoundError(
          `Unknown action '${action}'`
        );
    }
  }

  public async sendWednesdayMemeFollowUp(interaction: DiscordInteraction): Promise<void> {
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

      const result = await this.discordRequestAdapter.sendPatch(
        `${interaction.token}/messages/@original`,
        webhookMessage
      );
      console.debug('Discord result', result);
    } catch (error) {
      console.error('Failed to fetch an wednesday meme embed', error);
    }
  }
}
