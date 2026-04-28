import axios from 'axios';
import 'dotenv/config';

const DISCORD_API_URL = 'https://discord.com/api/v10';

const appId = process.env.DISCORD_APP_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.GUILD_ID;

if (!appId || !botToken) {
  console.error('Missing required env vars: DISCORD_APP_ID, DISCORD_BOT_TOKEN');
  process.exit(1);
}

const commands = [
  {
    name: 'cat',
    description: 'Get a random cat photo',
    options: [
      {
        name: 'tags',
        description: 'Filter by tags (e.g. cute, funny)',
        type: 3, // STRING
        required: false,
      },
    ],
  },
];

const url = guildId
  ? `${DISCORD_API_URL}/applications/${appId}/guilds/${guildId}/commands`
  : `${DISCORD_API_URL}/applications/${appId}/commands`;

const scope = guildId ? `guild ${guildId}` : 'global';

(async () => {
  console.log(`Registering Nyan commands (${scope})...`);
  await axios.put(url, commands, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  console.log(`Done. ${commands.length} command(s) registered.`);
  if (!guildId) {
    console.log('Note: global commands can take up to 1 hour to propagate.');
  }
})().catch((err) => {
  console.error('Failed:', err.response?.data ?? err.message);
  process.exit(1);
});
