const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your balance.')
        .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to check the balance for')
            .setRequired(false)
        ),
  // command execution
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const userdb = new sqlite3.Database('./users.db');

        try {
            userdb.get('SELECT balance FROM users WHERE id = ?', [user.id], async (err, row) => {
                let balance;
                if (err) {
                    console.error(err);
                    balance = config.default_balance;
                } else if (row && row.balance != null) {
                    balance = row.balance;
                } else {
                    balance = config.default_balance;
                }
                const embed = new EmbedBuilder()
                    .setColor(config.embed_color)
                    .setTitle(`${user.username}'s Balance`)
                    .setDescription(`💰 Balance: **${balance}**`)
                    .setThumbnail(user.displayAvatarURL());
                await interaction.reply({ embeds: [embed] });
                userdb.close();
            });
        } catch (error) {
            console.error('Unexpected error:', error);
            await interaction.reply('An error occurred while fetching the balance.');
        }
    },
};
