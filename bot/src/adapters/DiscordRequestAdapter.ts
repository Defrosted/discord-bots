import { DiscordWebhookMessage, DiscordWebhookMessageFile } from '@domain/DiscordWebhookMessage';
import { ExternalRestAPIClientPort } from '@ports/ExternalPort';
import axios from 'axios';

const discordApiBaseUrl = 'https://discord.com/api';

export class DiscordRequestAdapter<ResultType> implements ExternalRestAPIClientPort<DiscordWebhookMessage, ResultType, DiscordWebhookMessageFile> {
  constructor(private applicationId: string) {}

  private static buildFormData(data: Parameters<FormData['append']>[]) {
    const formData = new FormData();

    data.forEach(args => {
      formData.append(...args);
    });

    return formData;
  }

  public async sendPatch(endpoint: string, data: DiscordWebhookMessage, files?: DiscordWebhookMessageFile[]) {
    let requestData: FormData | DiscordWebhookMessage;
    if(files) {
      requestData = DiscordRequestAdapter.buildFormData([
        ['payload_json', new Blob([ JSON.stringify(data) ], { type: 'application/json' })],
        ...files.map(({ bytes, filename }, index) => ([ `file[${index}]`, bytes, filename ] as Parameters<FormData['append']>))
      ]);
    } else {
      requestData = data;
    }

    console.info('Sending Discord patch request', data);
    const result = await axios.patch<ResultType>(`${discordApiBaseUrl}/webhooks/${this.applicationId}/${endpoint}`, requestData, {
      headers: {
        'Content-Type': files ? 'multipart/form-data' : 'application/json'
      }
    });

    return result.data;
  }
}
