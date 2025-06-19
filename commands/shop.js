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
				.setFooter({ text: `Command executed by ${interaction.user.tag}` });

			const rows = await new Promise((resolve, reject) => {
				itemsdb.all('SELECT * FROM items ORDER BY price ASC', [], (err, rows) => {
					if (err) reject(err);
					else resolve(rows);
				});
			});

			if (!rows || rows.length === 0) {
				await interaction.editReply({ content: 'The shop is currently empty.' });
				return;
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