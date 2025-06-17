const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

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
  async execute(interaction, userdb) {
    const user = interaction.options.getUser('user') || interaction.user;
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
        .setColor(0x008080)
        .setTitle(`${user.username}'s Balance`)
        .setDescription(`💰 Balance: **${balance}**`)
        .setThumbnail(user.displayAvatarURL());
      await interaction.reply({ embeds: [embed] });
    });
  },
};
