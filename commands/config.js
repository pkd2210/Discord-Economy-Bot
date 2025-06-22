const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const fs = require('fs');
const configPath = './config.json';
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

//command setup
module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Configure the shop settings.')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addStringOption(option =>
			option.setName('option')
				.setDescription('Select a configuration option to update')
				.setRequired(true)
				.addChoices(
					...Object.keys(config).map(key => ({ name: key, value: key }))
				)
		)
		.addStringOption(option =>
			option.setName('value')
				.setDescription('The new value for the selected option')
				.setRequired(true)
		),
	// command execution
	async execute(interaction) {
		const option = interaction.options.getString('option');
		const value = interaction.options.getString('value');

		// Validate the option
		if (!config.hasOwnProperty(option)) {
			return interaction.reply({ content: 'Invalid configuration option.', flags: MessageFlags.Ephemeral });
		}
		// Update the configuration
		if (option === 'log_channel_id') {
			const channel = interaction.guild.channels.cache.get(value);
			if (!channel || !channel.isTextBased()) {
				return interaction.reply({ content: 'Invalid channel ID provided.', flags: MessageFlags.Ephemeral });
			}
		} else if (option === 'embed_color') {
			if (!/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
				return interaction.reply({ content: 'Invalid color format. Use hex format like #RRGGBB.', flags: MessageFlags.Ephemeral });
			}
		}
		config[option] = value;
		fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
		
		// add logs
		const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
				if (logChannel) {
					const logEmbed = new EmbedBuilder()
						.setColor(config.embed_color)
						.setTitle('Config Updated')
						.setDescription(`${interaction.user.tag} updated the configuration option **${option}** to **${value}**.`)
						.setTimestamp();
					logChannel.send({ embeds: [logEmbed] });
				}
				return interaction.reply({ content: `Configuration ${option} changed to ${value}, successfully, restart the bot to update the configs`, flags: MessageFlags.Ephemeral });
	}
};