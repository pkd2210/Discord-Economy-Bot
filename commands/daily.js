const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Get your daily payout.'),
  // command execution
    async execute(interaction) {
		// import the database
        const userdb = new sqlite3.Database('./users.db');
		payout = config.daily_payout;
		// Check if the daily command is enabled
		if (config.daily_payout <= 0) {
			return interaction.reply({ content: 'Daily payouts are currently disabled.', flags: MessageFlags.Ephemeral });
		}

		// Check if the user has already claimed their daily payout
		userdb.get('SELECT last_daily FROM users WHERE id = ?', [interaction.user.id], (err, row) => {
			if (err) {
				console.error(err);
				return interaction.reply({ content: 'An error occurred while checking your daily payout status.', flags: MessageFlags.Ephemeral });
			}
			const now = Date.now();
			if (row && row.last_daily && now - row.last_daily < 86400000) {
				return interaction.reply({ content: `You need to wait another ${Math.ceil((86400000 - (now - row.last_daily)) / 3600000)} hours before claiming your daily payout again.`, flags: MessageFlags.Ephemeral });
			}
			// If the user does not exist, insert them with the payout
			if (!row) {
				userdb.run('INSERT INTO users (id, balance, last_daily) VALUES (?, ?, ?)', [interaction.user.id, payout, now], (err) => {
					if (err) {
						console.error(err);
						return interaction.reply({ content: 'An error occurred while adding you to the database.', flags: MessageFlags.Ephemeral });
					}
					const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
					if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(config.embed_color)
						.setTitle('Balance Added - Daily')
						.setDescription(`Added ${payout} balance to ${interaction.user.username} By Using /Daily.`)
						.setThumbnail(interaction.user.displayAvatarURL())
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
					}

					// Return a success message
					return interaction.reply({ content: `You have claimed your daily payout of ${payout} balance!`, flags: MessageFlags.Ephemeral });
				});
			}
			else {
				// If the user exists, update their balance and last_daily
				userdb.run('UPDATE users SET balance = balance + ?, last_daily = ? WHERE id = ?', [payout, now, interaction.user.id], (err) => {
					if (err) {
						console.error(err);
						return interaction.reply({ content: 'An error occurred while updating your balance.', flags: MessageFlags.Ephemeral });
					}
					const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
					if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(config.embed_color)
						.setTitle('Balance Added - Daily')
						.setDescription(`Added ${payout} balance to ${interaction.user.username} By Using /Daily.`)
						.setThumbnail(interaction.user.displayAvatarURL())
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
					}

					// Return a success message
					return interaction.reply({ content: `You have claimed your daily payout of ${payout} balance!`, flags: MessageFlags.Ephemeral });
				});
			}
		});
	}
}