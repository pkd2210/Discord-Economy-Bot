const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();

//command setup
module.exports = {
  data: new SlashCommandBuilder()
	.setName('buyitem')
	.setDescription('Purchase an item from the shop.')
	.addIntegerOption(option =>
		option.setName('id')
		.setDescription('The id of the item to purchase')
		.setRequired(true)
	),
	// command execution
	async execute(interaction) {
		const itemsdb = new sqlite3.Database('./items.db');
		const userdb = new sqlite3.Database('./users.db');
		const id = interaction.options.getInteger('id');

		itemsdb.get(`SELECT * FROM items WHERE id = ?`, [id], async (err, item) => {
			if (err) {
				console.error(err);
				return interaction.reply({ content: 'There was an error retrieving the item from the database.', flags: MessageFlags.Ephemeral });
			}
			if (!item) {
				return interaction.reply({ content: `Item with ID **${id}** does not exist.`, flags: MessageFlags.Ephemeral });
			}
			const userId = interaction.user.id;
			userdb.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, user) => {
				if (err) {
					console.error(err);
					return interaction.reply({ content: 'There was an error retrieving your data from the database.', flags: MessageFlags.Ephemeral });
				}
				if (!user || user.balance < item.price) {
					return interaction.reply({ content: 'You do not have enough balance to purchase this item.', flags: MessageFlags.Ephemeral });
				}

				if (!item.stock_code || item.stock_code === 0) {
					// stock using item
					if (item.stock <= 0) {
						return interaction.reply({ content: `Item with ID **${id}** is out of stock.`, flags: MessageFlags.Ephemeral });
					}
					// make the purchase
					userdb.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [item.price, userId], function(err) {
						if (err) {
							console.error(err);
							return interaction.reply({ content: 'There was an error processing your purchase.', flags: MessageFlags.Ephemeral });
						}
						itemsdb.run(`UPDATE items SET stock = stock - 1 WHERE id = ?`, [id]);
						// send the reward
						const rewardChannel = interaction.guild.channels.cache.get(config.reward_room);
						if (rewardChannel) {
							rewardChannel.send(`<@&${config.reward_giver_id}>: <@${userId}> bought **${item.name}** for **${item.price}**!`);
						}
						return interaction.reply({ content: `You have purchased **${item.name}** for **${item.price}**!`, flags: MessageFlags.Ephemeral });
					});
				} else {
					// code using item
					const tableName = `${id}_codes`;
					itemsdb.get(`SELECT * FROM "${tableName}" LIMIT 1`, [], (err, codeRow) => {
						if (err) {
							console.error(err);
							return interaction.reply({ content: 'There was an error checking item codes.', flags: MessageFlags.Ephemeral });
						}
						if (!codeRow) {
							return interaction.reply({ content: `Item with ID **${id}** is out of codes.`, flags: MessageFlags.Ephemeral });
						}
						// make the purchase
						userdb.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [item.price, userId], function(err) {
							if (err) {
								console.error(err);
								return interaction.reply({ content: 'There was an error processing your purchase.', flags: MessageFlags.Ephemeral });
							}
							itemsdb.run(`DELETE FROM "${tableName}" WHERE id = ?`, [codeRow.id]);
							// send the reward
							const rewardChannel = interaction.guild.channels.cache.get(config.reward_room);
							if (rewardChannel) {
								rewardChannel.send(`<@&${config.reward_giver_id}>: <@${userId}> bought **${item.name}** for **${item.price}**!`);
							}
							interaction.user.send(`You have purchased **${item.name}** for **${item.price}**!\nYour code: ${codeRow.code}`).catch(() => {});
							return interaction.reply({ content: `You have purchased **${item.name}** for **${item.price}**!\nYour code: ${codeRow.code}`, flags: MessageFlags.Ephemeral });
						});
					});
				}
			});
		});
	},
};