import { Api, Config, Cron, Function, Table } from 'sst/constructs';
import { StackContext } from 'sst/constructs/FunctionalStack';

export function WednesdayStack({ stack }: StackContext) {
  const region = new Config.Parameter(stack, 'REGION', {
    value: stack.region,
  });

  const discordApiUrl = new Config.Parameter(stack, 'DISCORD_API_URL', {
    value: 'https://discord.com/api',
  });
  const discordApplicationId = new Config.Secret(
    stack,
    'DISCORD_APPLICATION_ID',
  );
  const discordAuthToken = new Config.Secret(stack, 'DISCORD_AUTH_TOKEN');
  const discordPublicKey = new Config.Secret(stack, 'DISCORD_PUBLIC_KEY');

  const redditAuthUrl = new Config.Parameter(stack, 'REDDIT_AUTH_URL', {
    value: 'https://www.reddit.com/api/v1/access_token',
  });
  const redditApiUrl = new Config.Parameter(stack, 'REDDIT_API_URL', {
    value: 'https://oauth.reddit.com/r/ItIsWednesday/random',
  });
  const redditUserAgent = new Config.Parameter(stack, 'REDDIT_USER_AGENT', {
    value: 'aws:wednesday-bot:v1.0.0 (by /u/Lambda256)',
  });
  const redditClientId = new Config.Secret(stack, 'REDDIT_CLIENT_ID');
  const redditClientSecret = new Config.Secret(stack, 'REDDIT_CLIENT_SECRET');

  const botConfigurationTable = new Table(stack, 'BotConfiguration', {
    fields: {
      serverId: 'string',
      channelId: 'string',
    },
    primaryIndex: {
      partitionKey: 'serverId',
      sortKey: 'channelId',
    },
  });

  const configureBotFunction = new Function(stack, 'ConfigureBotFunction', {
    functionName: `configure-bot-${stack.stage}`,
    handler: 'bot/src/wednesday/entrypoints/events/configure-bot.handler',
    bind: [
      region,
      discordApiUrl,
      discordApplicationId,
      discordAuthToken,
      botConfigurationTable,
    ],
  });

  const sendWednesdayMemeFunction = new Function(
    stack,
    'SendWednesdayMemeFunction',
    {
      functionName: `send-wednesday-meme-${stack.stage}`,
      handler:
        'bot/src/wednesday/entrypoints/events/send-wednesday-meme.handler',
      bind: [
        region,
        discordApiUrl,
        discordApplicationId,
        discordAuthToken,
        botConfigurationTable,
        redditApiUrl,
        redditAuthUrl,
        redditClientId,
        redditClientSecret,
        redditUserAgent,
      ],
    },
  );
  new Cron(stack, 'SendWednesdayMemeCronJob', {
    schedule: 'cron(0 0 ? * WED *)',
    job: sendWednesdayMemeFunction,
  });

  const routeDiscordWebHookFunction = new Function(
    stack,
    'RouteDiscordWebhookActionFunction',
    {
      functionName: `route-discord-webhook-action-${stack.stage}`,
      handler:
        'bot/src/wednesday/entrypoints/rest/route-discord-webhook-action.handler',
      bind: [
        region,
        discordApiUrl,
        discordPublicKey,
        configureBotFunction,
        sendWednesdayMemeFunction,
      ],
    },
  );

  const api = new Api(stack, 'WednesdayBotAPI', {
    routes: {
      'POST /discord': routeDiscordWebHookFunction,
    },
  });

  stack.addOutputs({
    ApiUrl: api.url,
  });
}
