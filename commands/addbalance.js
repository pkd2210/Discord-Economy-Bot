const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');

//command setup
module.exports = {
  data: new SlashCommandBuilder()
    .setName('addbalance')
    .setDescription('Add balance to a user.')
	.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to add balance to')
        .setRequired(true)
    )
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('The amount of balance to add')
        .setRequired(true)
        .setMinValue(1)
    ),
  // command execution
    async execute(interaction, userdb) {
		// Get the user and amount from the interaction options
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
		// Check if the user exists in the database
		userdb.get('SELECT balance FROM users WHERE id = ?', [user.id], async (err, row) => {
			if (err) {
				console.error(err);
				return interaction.reply({ content: 'There was an error accessing the database.', flags: MessageFlags.Ephemeral });
			}

			// If the user does not exist, insert them with the balance in amount
			if (!row) {
				userdb.run('INSERT INTO users (id, balance) VALUES (?, ?)', [user.id, amount], async (err) => {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error adding the user to the database.', flags: MessageFlags.Ephemeral });
				}
				else {
					// send to the log room in config.log_channel_id
					const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
					if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(0x008080)
						.setTitle('Balance Added')
						.setDescription(`Added ${amount} balance to ${user.username} By ${interaction.user.tag}.`)
						.setThumbnail(user.displayAvatarURL())
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
					}

					// Return a success message
					return interaction.reply({ content: `Added ${amount} balance to ${user.username}.`, flags: MessageFlags.Ephemeral });
				}
				});
			} 
			else {
				// If the user exists, update their balance
				const newBalance = row.balance + amount;
				userdb.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, user.id], async (err) => {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error updating the balance.', flags: MessageFlags.Ephemeral });
				}
				else {
					// send to the log room in config.log_channel_id
					const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
					if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(0x008080)
						.setTitle('Balance Added')
						.setDescription(`Added ${amount} balance to ${user.username} By ${interaction.user.tag}.`)
						.setThumbnail(user.displayAvatarURL())
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
					}

					// Return a success message
					return interaction.reply({ content: `Added ${amount} balance to ${user.username}.`, flags: MessageFlags.Ephemeral });
				}
				});
			}
		});
	}
}
