export interface IBotConfiguration {
  serverId: string;
  channelId: string;
}

export class BotConfiguration implements IBotConfiguration {
  public serverId: string;
  public channelId: string;

  constructor({ serverId, channelId }: IBotConfiguration) {
    this.serverId = serverId;
    this.channelId = channelId;
  }

  public toObject() {
    return { ...this };
  }
}
