const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Check the shop for items you can buy.'),
  // command execution
    async execute(interaction) {
		// import the database
        const itemsdb = new sqlite3.Database('./items.db');
		try {
			await interaction.deferReply();

			const embed = new EmbedBuilder()
				.setColor(config.embed_color)
				.setTitle(`Items Shop`)
				.setDescription('ID: Name - description - price')

			const rows = await new Promise((resolve, reject) => {
				itemsdb.all('SELECT * FROM items ORDER BY price ASC', [], (err, rows) => {
					if (err) reject(err);
					else resolve(rows);
				});
			});
			if (rows.length === 0) {
				embed.setDescription('No items available in the shop.');
				return await interaction.editReply({ embeds: [embed] });
			}

			rows.forEach((row) => {
				embed.addFields({
					name: `${row.id}: ${row.name}`,
					value: `- ${row.description} - **${row.price}**`,
					inline: false
				});
			});

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('Error in shop command:', error);		}
    }
}