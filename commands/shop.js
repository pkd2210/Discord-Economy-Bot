const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

//command setup
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Check the shop for items you can buy.'),
  // command execution
    async execute(interaction, itemsdb) {
		try {
			await interaction.deferReply();

			const embed = new EmbedBuilder()
				.setColor(0x008080)
				.setTitle(`Items Shop`)
				.setDescription('ID: Name - description - price (stock)')

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
					value: `- ${row.description} - **${row.price}** (${row.stock})`,
					inline: false
				});
			});

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('Error in shop command:', error);		}
    }
}