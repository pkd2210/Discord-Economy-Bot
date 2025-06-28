const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
  data: new SlashCommandBuilder()
	.setName('removeitem')
	.setDescription('Remove a item from the shop.')
	.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
	.addIntegerOption(option =>
		option.setName('id')
		.setDescription('The id of the item to remove')
		.setRequired(true)
	),
	// command execution
	async execute(interaction) {
		const itemsdb = new sqlite3.Database('./items.db');
		const id = interaction.options.getInteger('id');
		const tableName = `${id}_codes`;

		itemsdb.run(
			'DELETE FROM items WHERE id = ?',
			[id],
			async function (err) {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error removing the item from the database.', flags: MessageFlags.Ephemeral });
				}

				// Drop the codes table for this item if it exists
				itemsdb.run(`DROP TABLE IF EXISTS "${tableName}"`, [], function(dropErr) {
					if (dropErr) {
						console.error(dropErr);
					}

					const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
					if (logChannel) {
						const logEmbed = new EmbedBuilder()
							.setColor(config.embed_color)
							.setTitle('Item Removed')
							.setDescription(`item **${id}** was removed.`)
							.setTimestamp();
						logChannel.send({ embeds: [logEmbed] });
					}
					return interaction.reply({ content: `Item **${id}** was removed successfully!`, flags: MessageFlags.Ephemeral });
				});
			}
		);
	}
}