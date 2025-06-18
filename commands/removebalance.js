const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removebalance')
        .setDescription('Remove balance from a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove balance from')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of balance to remove')
                .setRequired(true)
                .setMinValue(1)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
    async execute(interaction, userdb) {
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        userdb.get('SELECT balance FROM users WHERE id = ?', [user.id], async (err, row) => {
            if (err) {
                console.error(err);
                return interaction.reply({ content: 'There was an error accessing the database.', flags: MessageFlags.Ephemeral });
            }
            if (row) {
                const newBalance = row.balance - amount;
				if (newBalance < 0) {
					return interaction.reply({ content: 'Cannot remove more balance than the user has.', flags: MessageFlags.Ephemeral });
				}
                userdb.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, user.id], async (err) => {
                    if (err) {
                        console.error(err);
                        return interaction.reply({ content: 'There was an error updating the balance.', flags: MessageFlags.Ephemeral });
                    } else {
                        const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setColor(0x008080)
                                .setTitle('Balance Removed')
                                .setDescription(`${amount} balance removed from ${user.tag} by ${interaction.user.tag}.`)
                                .setTimestamp();
                            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
                        }
                        return interaction.reply({ content: `Removed ${amount} balance from ${user.username}.`, flags: MessageFlags.Ephemeral });
                    }
                });
            } else {
                return interaction.reply({ content: 'User not found in the database.', flags: MessageFlags.Ephemeral });
            }
        });
    },
};