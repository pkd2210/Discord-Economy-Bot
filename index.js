// Import modules and set up environment variables
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Set up the commands array and read command files
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error('Please set DISCORD_TOKEN, CLIENT_ID, and GUILD_ID in your .env file.');
  process.exit(1);
}
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Import each command file and push its data to the commands array
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

// Create a new REST instance and set the token
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Register the commands with Discord's API
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Actual Code starts here
// Import the Discord client and set up the event handlers
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Log in to Discord with the bot token
client.login(process.env.DISCORD_TOKEN);