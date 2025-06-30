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

// Setup User DataBase Using SQLite
const userdb = new sqlite3.Database('./users.db', (err) => {
	if (err) {
		console.error('Could not connect to users database:', err);
		process.exit(1); // Exit the process if the database cannot be initialized
	} else {
		console.log('Connected to SQLite users database');
		// Create users table if it doesn't exist
		userdb.run(`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			balance INTEGER DEFAULT 0,
			last_daily INTEGER
		)`, (err) => {
			if (err) {
				console.error('Could not create users table:', err);
				process.exit(1); // Exit the process if the table cannot be created
			} else {
				console.log('Users table ready');
			}
		});
	}
});

// Setup Items DataBase Using SQLite
const itemsdb = new sqlite3.Database('./items.db', (err) => {
	if (err) {
		console.error('Could not connect to items database:', err);
		process.exit(1); // Exit the process if the database cannot be initialized
	} else {
		console.log('Connected to SQLite items database');
		// Create items table if it doesn't exist
		itemsdb.run(`CREATE TABLE IF NOT EXISTS items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT,
			price INTEGER DEFAULT 0,
			stock INTEGER DEFAULT 0,
			stock_code INTEFER DEFAULT 0
		)`, (err) => {
			if (err) {
				console.error('Could not create items table:', err);
				process.exit(1); // Exit the process if the table cannot be created
			} else {
				console.log('Items table ready');
			}
		});
	}
});

// Add a listener for the 'ready' event to confirm the bot is running
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// On user join server, add them to the database
client.on('guildMemberAdd', member => {
	userdb.run(
		`INSERT OR IGNORE INTO users (id, balance) VALUES (?, ?)`,[member.id, config.defaul_balance],
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
				`INSERT OR IGNORE INTO users (id, balance) VALUES (?, ?)`, [member.id, config.default_balance],
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

// Giveaway system
// Giveaway button handler
client.on('interactionCreate', async btnInteraction => {
    if (!btnInteraction.isButton()) return;
    const customId = btnInteraction.customId;
    if (!customId.startsWith('enter_giveaway_')) return;
    const giveawayId = customId.split('_')[2];
    const userId = btnInteraction.user.id;
    const giveawaysdb = new sqlite3.Database('./giveaways.db');
    giveawaysdb.get('SELECT * FROM giveaways WHERE id = ?', [giveawayId], (err, giveaway) => {
        if (err || !giveaway) {
            return btnInteraction.reply({ content: 'Giveaway not found or error occurred.', flags: MessageFlags.Ephemeral });
        }
        const channelId = giveaway.channel_id;
        const price = giveaway.price;
        // Check if user already entered
        giveawaysdb.get(`SELECT * FROM "${channelId}_giveaways" WHERE user_id = ?`, [userId], (err, row) => {
            if (row && row.entered) {
                return btnInteraction.reply({ content: 'You have already entered this giveaway!', flags: MessageFlags.Ephemeral });
            }
            // remove the points from the user
            const userdb = new sqlite3.Database('./users.db');
            userdb.get('SELECT balance FROM users WHERE id = ?', [userId], (err, userRow) => {
                if (!userRow || userRow.balance < price) {
                    return btnInteraction.reply({ content: 'You do not have enough points to enter this giveaway.', flags: MessageFlags.Ephemeral });
                }
                userdb.run('UPDATE users SET balance = balance - ? WHERE id = ?', [price, userId], (err) => {
                    if (err) {
                        return btnInteraction.reply({ content: 'Error deducting points.', flags: MessageFlags.Ephemeral });
                    }
                    giveawaysdb.run(`INSERT OR IGNORE INTO "${channelId}_giveaways" (user_id, entered) VALUES (?, 1)`, [userId], (err) => {
                        if (err) {
                            return btnInteraction.reply({ content: 'Error entering giveaway.', flags: MessageFlags.Ephemeral });
                        }
                        btnInteraction.reply({ content: 'You have entered the giveaway!', flags: MessageFlags.Ephemeral });
                    });
                });
            });
        });
    });
});

// When giveaway ends, select a random winner
client.on('ready', () => {
	// Set an interval to check for ended giveaways every minute
	setInterval(() => {	
		const now = Date.now();
		const giveawaysdb = new sqlite3.Database('./giveaways.db');
		giveawaysdb.all('SELECT * FROM giveaways WHERE end_time <= ?', [now], (err, giveaways) => {
			if (err) {	
				console.error('Error fetching ended giveaways:', err);
				return;
			}
			giveaways.forEach(giveaway => {
				const channelId = giveaway.channel_id;
				const prize = giveaway.prize;
				const winnersCount = giveaway.winners;
				const channel = client.channels.cache.get(channelId);
				if (!channel) {
					console.error(`Channel with ID ${channelId} not found for giveaway ${giveaway.id}`);
					return;
				}
				giveawaysdb.all(`SELECT user_id FROM "${channelId}_giveaways" WHERE entered = 1`, [], (err, entries) => {
					if (err) {
						console.error('Error fetching giveaway entries:', err);
						return;
					}
					if (entries.length === 0) {
						channel.send(`Giveaway for **${giveaway.name}** ended with no entries.`);
						giveawaysdb.run('DELETE FROM giveaways WHERE id = ?', [giveaway.id]);
						giveawaysdb.run(`DROP TABLE IF EXISTS "${channelId}_giveaways"`, [], (err) => {
							if (err) {
								console.error('Error dropping giveaway entries table:', err);
							}
						});
						return;
					}
					// When giveaway end system
					const winners = [];
					const shuffledEntries = entries.sort(() => 0.5 - Math.random());
					for (let i = 0; i < winnersCount && i < shuffledEntries.length; i++) {
						winners.push(shuffledEntries[i].user_id);
					}
					const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
					channel.send(`Giveaway for **${giveaway.name}** has ended! Winners: ${winnerMentions} 🎉\nPrize: **${prize}** points.`)
					// Change the winners's balance
					const userdb = new sqlite3.Database('./users.db');
					winners.forEach(winnerId => {
						userdb.run('UPDATE users SET balance = balance + ? WHERE id = ?', [prize, winnerId], (err) => {
							if (err) {
								console.error(`Error updating balance for winner ${winnerId}:`, err);
							}
						});
					});
					giveawaysdb.run('DELETE FROM giveaways WHERE id = ?', [giveaway.id], (err) => {
						if (err) {
							console.error('Error deleting giveaway:', err);
						}
					});
					giveawaysdb.run(`DROP TABLE IF EXISTS "${channelId}_giveaways"`, [], (err) => {
						if (err) {
							console.error('Error dropping giveaway entries table:', err);
						}
					});
				});
			});
		});
	}, 60000);
});

// Add a collection to store commands
const commandsCollection = new Map();
for (const file of commandFiles) {
	const command = require(path.join(commandsPath, file));
	commandsCollection.set(command.data.name, command);
}

// Add this event handler to handle slash commands
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = commandsCollection.get(interaction.commandName);
	if (!command) return;
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(`Error executing command ${interaction.commandName}:`, error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});


// Ensure the bot logs in and handle login errors
client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
    process.exit(1); // Exit the process if login fails
});