const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
  data: new SlashCommandBuilder()
	.setName('adstock')
	.setDescription('Add a new code to the stock of a item.')
	.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
	.addIntegerOption(option =>
		option.setName('id')
		.setDescription('The id of the item.')
		.setRequired(true)
	)
	.addStringOption(option => 
		option.setName('newcode')
		.setDescription('The code to add to the stock of the item')
		.setRequired(true)
	),
	// command execution
	async execute(interaction) {
		const itemsdb = new sqlite3.Database('./items.db');
		const itemid = interaction.options.getInteger('id');
		const newcode = interaction.options.getString('newcode');
		const tableName = `${itemid}_codes`;

		itemsdb.run(
			`INSERT INTO "${tableName}" (code) VALUES (?)`,
			[newcode],
			function (err) {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error adding the code to the item stock.', flags: MessageFlags.Ephemeral });
				}
				const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
				if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(config.embed_color)
						.setTitle('Stock Code Added')
						.setDescription(`Stock code added to the item with the id ${itemid}.`)
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
				}
				return interaction.reply({ content: `Stock was uccessfully added into ${itemid}!`, flags: MessageFlags.Ephemeral });
			}
		);
	}
}