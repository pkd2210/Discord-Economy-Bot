// Import modules and set up environment variables
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config.json');
const { MessageFlags } = require('discord.js');

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

// On error
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	try {
		const command = require(`./commands/${interaction.commandName}.js`);
		await command.execute(interaction, userdb);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

// Setup User DataBase Using SQLite
const userdb = new sqlite3.Database('./users.db', (err) => {
	if (err) {
		console.error('Could not connect to database', err);
	} else {
		console.log('Connected to SQLite database');
		// Create users table if it doesn't exist
		userdb.run(`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			balance INTEGER DEFAULT 0,
			last_daily INTEGER
		)`, (err) => {
			if (err) {
				console.error('Could not create users table', err);
			} else {
				console.log('Users table ready');
			}
		});
	}
});

// Setup User DataBase Using SQLite
const itemsdb = new sqlite3.Database('./items.db', (err) => {
	if (err) {
		console.error('Could not connect to database', err);
	} else {
		console.log('Connected to SQLite database');
		// Create items table if it doesn't exist
		itemsdb.run(`CREATE TABLE IF NOT EXISTS items (
			id TEXT PRIMARY KEY,
			category TEXT DEFAULT 'general',
			name TEXT NOT NULL,
			description TEXT,
			price INTEGER DEFAULT 0,
			stock INTEGER DEFAULT 0,
			image_url TEXT
		)`, (err) => {
			if (err) {
				console.error('Could not create items table', err);
			} else {
				console.log('Items table ready');
			}
		});
	}
});


// On user join server, add them to the database
client.on('guildMemberAdd', member => {
	userdb.run(
		`INSERT OR IGNORE INTO users (id, balance) VALUES (?, ?)`,[member.id, config.defaultBalance],
		(err) => {
			if (err) {
				console.error('Error adding user to database', err);
			}
		}
	);
});

// add everyone in the guild to the database
client.on('guildCreate', guild => {
	guild.members.fetch().then(members => {
		members.forEach(member => {
			userdb.run(
				`INSERT OR IGNORE INTO users (id, balance) VALUES (?, ?)`, [member.id, config.defaultBalance],
				(err) => {
					if (err) {
						console.error('Error adding user to database', err);
					}
				}
			);
		});
	}).catch(err => {
		console.error('Error fetching members', err);
	});
});

// Ways to earn balance
// Award balance to users for sending messages, with cooldown to prevent spam
const messageCooldown = new Map();

client.on('messageCreate', message => {
    if (message.author.bot) return; // Ignore bot messages

    const userId = message.author.id;
    const cooldown = (config.messages_cooldown_secends || 30) * 1000;

    // Cooldown check
    if (messageCooldown.has(userId)) {
        const last = messageCooldown.get(userId);
        if (Date.now() - last < cooldown) return;
    }
    messageCooldown.set(userId, Date.now());

    // Check if the user exists in the database, if not, add them
    userdb.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error('Error accessing database', err);
            return;
        }
        if (!row) {
            userdb.run('INSERT INTO users (id, balance) VALUES (?, ?)', [userId, config.default_balance]);
        } else {
            // Award balance for sending a message
            const earnedBalance = config.balance_per_message;
            userdb.run('UPDATE users SET balance = balance + ? WHERE id = ?', [earnedBalance, userId], (err) => {
                if (err) {
                    console.error('Error updating balance for messages', err);
                }
            });
        }
    });
});

// Export db
module.exports = { userdb, itemsdb };
// Log in to Discord with the bot token
client.login(process.env.DISCORD_TOKEN);