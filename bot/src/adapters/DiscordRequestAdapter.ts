import { DiscordWebhookMessage, DiscordWebhookMessageFile } from '@domain/DiscordWebhookMessage';
import { ExternalAPIMethods, ExternalRestAPIClientPort } from '@ports/ExternalPort';
import axios from 'axios';

const discordApiBaseUrl = 'https://discord.com/api';

export class DiscordRequestAdapter<ResultType = Record<string, unknown>> implements ExternalRestAPIClientPort<DiscordWebhookMessage, ResultType, DiscordWebhookMessageFile> {
  private static buildFormData(data: Parameters<FormData['append']>[]) {
    const formData = new FormData();

    data.forEach(args => {
      formData.append(...args);
    });

    return formData;
  }

  public async sendRequest(method: ExternalAPIMethods, endpoint: string, data: DiscordWebhookMessage, files?: DiscordWebhookMessageFile[], authToken?: string) {
    let requestData: FormData | DiscordWebhookMessage;
    if(files) {
      requestData = DiscordRequestAdapter.buildFormData([
        ['payload_json', new Blob([ JSON.stringify(data) ], { type: 'application/json' })],
        ...files.map(({ bytes, filename }, index) => ([ `file[${index}]`, bytes, filename ] as Parameters<FormData['append']>))
      ]);
    } else {
      requestData = data;
    }

    const headers: Record<string, string> = {
      'Content-Type': files ? 'multipart/form-data' : 'application/json'
    };

    if(authToken)
      headers['Authorization'] = `Bot ${authToken}`;

    const result = await axios[method]<ResultType>(`${discordApiBaseUrl}/${endpoint}`, requestData, {
      headers
    });

    return result.data;
  }
}
