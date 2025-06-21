const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
  data: new SlashCommandBuilder()
	.setName('createitem')
	.setDescription('Create a new item for the shop.')
	.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
	.addStringOption(option =>
		option.setName('name')
		.setDescription('The name of the item')
		.setRequired(true)
	)
	.addStringOption(option => 
		option.setName('description')
		.setDescription('The description of the item')
		.setRequired(true)
	)
	.addIntegerOption(option =>
		option.setName('price')
		.setDescription('The price of the item')
		.setRequired(true)
	)
	.addIntegerOption(option =>
		option.setName('stock')
		.setDescription('The stock of the item')
		.setRequired(true)
	),
	// command execution
	async execute(interaction) {
		const itemsdb = new sqlite3.Database('./items.db');
		const name = interaction.options.getString('name');
		const description = interaction.options.getString('description');
		const price = interaction.options.getInteger('price');
		const stock = interaction.options.getInteger('stock');

		itemsdb.run(
			'INSERT INTO items (name, description, price, stock) VALUES (?, ?, ?, ?)',
			[name, description, price, stock],
			async (err) => {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error adding the item to the database.', flags: MessageFlags.Ephemeral });
				}
				const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
				if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(config.embed_color)
						.setTitle('Item Created')
						.setDescription(`Created item **${name}** for the shop.`)
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
				}
				return interaction.reply({ content: `Item **${name}** created successfully!`, flags: MessageFlags.Ephemeral });
			}
		);
	}
}