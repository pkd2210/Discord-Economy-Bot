const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edititem')
        .setDescription('Edit item details in the shop.')
		.addIntegerOption(option =>
			option.setName('id')
			.setDescription('The ID of the item to edit')
			.setRequired(true)
		)
        .addStringOption(option =>
			option.setName('name')
			.setDescription('The name of the item to edit')
			.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('description')
			.setDescription('The description of the item to edit')
			.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName('price')
			.setDescription('The price of the item to edit')
			.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName('stock')
			.setDescription('The stock of the item to edit')
			.setRequired(false)
		)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
    async execute(interaction) {
		// import the database
        const itemsdb = new sqlite3.Database('./items.db');

		const id = interaction.options.getInteger('id');
		const name = interaction.options.getString('name');
		const description = interaction.options.getString('description');
		const price = interaction.options.getInteger('price');
		const stock = interaction.options.getInteger('stock');

		itemsdb.get('SELECT * FROM items WHERE id = ?', [interaction.options.getInteger('id')], async (err, row) => {
			if (err) {
				return interaction.reply({ content: 'Error accesing the database.', flags: MessageFlags.Ephemeral });
			}
			if (!row) {
				return interaction.reply({ content: 'No item with this id in the database.', flags: MessageFlags.Ephemeral });
			}
			const updatedName = name || row.name;
			const updatedDescription = description || row.description;
			const updatedPrice = price !== null ? price : row.price;
			const updatedStock = stock !== null ? stock : row.stock;

		itemsdb.run('UPDATE items SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?', [updatedName, updatedDescription, updatedPrice, updatedStock, id], async (err) => {
			if (err) {
				console.error(err);
				return interaction.reply({ content: 'There was an error editing the item.', flags: MessageFlags.Ephemeral });
			} else {
				const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
				if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(config.embed_color)
						.setTitle('Item Edited')
						.setDescription(`Item ${id} was edited from ${row.name}, ${row.description}, ${row.price}, ${row.stock} to ${updatedName}, ${updatedDescription}, ${updatedPrice}, ${updatedStock}.`)
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] }).catch(console.error);
				}
				return interaction.reply({ content: `Item ${updatedName} Was Updated`, flags: MessageFlags.Ephemeral });
			}
		});
		});
	}
};
