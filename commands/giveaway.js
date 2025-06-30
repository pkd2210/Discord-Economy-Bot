const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
  data: new SlashCommandBuilder()
	.setName('giveaway')
	.setDescription('Create a giveaway for points.')
	.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
	.addStringOption(option =>
		option.setName('name')
		.setDescription('The name of the giveaway')
		.setRequired(true),
	)
	.addStringOption(option =>
		option.setName('description')
		.setDescription('The description of the giveaway')
		.setRequired(true),
	)
	.addIntegerOption(option =>
		option.setName('duration')
		.setDescription('The duration of the giveaway in seconds')
		.setRequired(true)
		.setMinValue(10),
	)
	.addChannelOption(option =>
		option.setName('channel')
		.setDescription('The channel where the giveaway will be announced')
		.setRequired(true),
	)
	.addIntegerOption(option =>
		option.setName('prize')
		.setDescription('The amount of points to be given as a prize')
		.setRequired(true)
		.setMinValue(0),
	)
	.addIntegerOption(option =>
		option.setName('price')
		.setDescription('The price of entrie to the giveaway')
		.setMinValue(0)
		.setRequired(false),
	)
	.addIntegerOption(option =>
		option.setName('winners')
		.setDescription('The number of winners for the giveaway (default is 1)')
		.setMinValue(1)
		.setRequired(false),
	),
	// command execution
	async execute(interaction) {
		//const itemsdb = new sqlite3.Database('./items.db');
		const name = interaction.options.getString('name');
		const description = interaction.options.getString('description');
		const price = interaction.options.getInteger('price') ?? 0;
		const winners = interaction.options.getInteger('winners') ?? 1;
		const duration = interaction.options.getInteger('duration');
		const channel = interaction.options.getChannel('channel');
		const prize = interaction.options.getInteger('prize');
		const endTime = Date.now() + duration * 1000;
		const channelId = channel.id;

		if (!channel || channel.type !== 0) { // 0 is for text channels
			return interaction.reply({ content: 'Please select a valid text channel for the giveaway.', flags: MessageFlags.Ephemeral });
		}

		// Create the giveaway database
		const giveawaysdb = new sqlite3.Database(`./giveaways.db`);
		giveawaysdb.run(`CREATE TABLE IF NOT EXISTS giveaways (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				description TEXT NOT NULL,
				price INTEGER NOT NULL,
				winners INTEGER NOT NULL,
				duration INTEGER NOT NULL,
				end_time INTEGER NOT NULL,
				channel_id TEXT NOT NULL,
				prize INTEGER NOT NULL
			)`,
			(err) => {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error creating the giveaway database.', flags: MessageFlags.Ephemeral });
				}
				giveawaysdb.run(`INSERT INTO giveaways (name, description, price, winners, duration, end_time, channel_id, prize) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
					[name, description, price, winners, duration, endTime, channelId, prize],
					function (err) {
						if (err) {
							console.error(err);
							return interaction.reply({ content: 'There was an error creating the giveaway.', flags: MessageFlags.Ephemeral });
						}
						const giveawayId = this.lastID;
						const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
						if (logChannel) {
							const logEmbed = new EmbedBuilder()
								.setColor(config.embed_color)
								.setTitle('Giveaway Created')
								.setDescription(`Giveaway **${name}** was created with a prize of **${prize}** points. Winners: **${winners}**. Duration: **${duration}** seconds.`)
								.setTimestamp();
							logChannel.send({ embeds: [logEmbed] });
						}
						const endDate = new Date(endTime);
						const giveawayEmbed = new EmbedBuilder()
							.setColor(config.embed_color)
							.setTitle(`Giveaway: ${name}`)
							.setDescription(description)
							.addFields(
								{ name: 'Price to Enter', value: `${price} points`, inline: true },
								{ name: 'Winners', value: `${winners}`, inline: true },
								{ name: 'Ends At', value: endDate.toLocaleString(), inline: true },
								{ name: 'Prize', value: `${prize} points`, inline: true }
							)
							.setTimestamp(endDate);

						const enterButton = new ButtonBuilder()
							.setCustomId(`enter_giveaway_${giveawayId}`)
							.setLabel('Enter Giveaway')
							.setStyle(ButtonStyle.Success);
						const row = new ActionRowBuilder().addComponents(enterButton);

						giveawaysdb.run(`CREATE TABLE IF NOT EXISTS "${channelId}_giveaways" (id INTEGER PRIMARY KEY AUTOINCREMENT,
							user_id TEXT NOT NULL,
							entered INTEGER NOT NULL DEFAULT 0,
							UNIQUE(user_id)
						)`, (err) => {
							if (err) {
								console.error('Error creating giveaways table:', err);
								return interaction.reply({ content: 'There was an error setting up the giveaway.', flags: MessageFlags.Ephemeral });
							}
							channel.send({ embeds: [giveawayEmbed], components: [row] })
							.then(() => {
								interaction.reply({ content: `Giveaway **${name}** has been created successfully!`, flags: MessageFlags.Ephemeral });
							})
							.catch(err => {
								console.error('Error sending giveaway message:', err);
								interaction.reply({ content: 'There was an error sending the giveaway message.', flags: MessageFlags.Ephemeral });
							});
						});
					}
				);
			}
		);
	}
};