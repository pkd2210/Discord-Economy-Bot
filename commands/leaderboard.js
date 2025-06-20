const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription(`Top ${config.leaderboard_limit} users with the most balance.`),
  // command execution
	async execute(interaction) {
		// import the database
        const userdb = new sqlite3.Database('./users.db');
		userdb.all('SELECT id, balance FROM users ORDER BY balance DESC LIMIT ?', [config.leaderboard_limit], (err, rows) => {
			if (err) {
				return interaction.reply({ content : 'An error occurred while fetching the leaderboard.', flags: MessageFlags.Ephemeral });
			}
			if (rows.length === 0) {
				return interaction.reply({ content: 'No users found in the leaderboard.', flags: MessageFlags.Ephemeral });
			}
			const embed = new EmbedBuilder()
				.setColor(config.embed_color)
				.setTitle('Leaderboard')
				.setDescription(`Top ${config.leaderboard_limit} users with the most balance:`)
				.setThumbnail(interaction.guild.iconURL())
				.setTimestamp();
			rows.forEach((row, index) => {
				const user = interaction.guild.members.cache.get(row.id) || { user: { username: 'Unknown User', displayAvatarURL: () => '' } };
				embed.addFields({
					name: `${index + 1}. ${user.user.username}`,
					value: `💰 Balance: **${row.balance}**`,
					inline: false
				});
			});
			interaction.reply({ embeds: [embed] });
		});
	}
};