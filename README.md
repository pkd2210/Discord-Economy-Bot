# Discord-Economy-Bot

## Widgets

[![GitHub Repo stars](https://img.shields.io/github/stars/pkd2210/Discord-Economy-Bot?style=social)](https://github.com/pkd2210/Discord-Economy-Bot/stargazers) [![GitHub forks](https://img.shields.io/github/forks/pkd2210/Discord-Economy-Bot?style=social)](https://github.com/pkd2210/Discord-Economy-Bot/network/members) [![GitHub issues](https://img.shields.io/github/issues/pkd2210/Discord-Economy-Bot)](https://github.com/pkd2210/Discord-Economy-Bot/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr/pkd2210/Discord-Economy-Bot)](https://github.com/pkd2210/Discord-Economy-Bot/pulls) [![GitHub last commit](https://img.shields.io/github/last-commit/pkd2210/Discord-Economy-Bot)](https://github.com/pkd2210/Discord-Economy-Bot/commits/main)

## Deployment

1. Install Node.js 22.x
2. Import the bot `git clone https://github.com/pkd2210/Discord-Economy-Bot.git`
3. Run `npm ci`
4. Create a `.env` file with:

   ```env
   DISCORD_TOKEN=YOUR_BOT_TOKEN
   CLIENT_ID=YOUR_CLIENT_ID
   GUILD_ID=YOUR_GUILD_ID
   ```

5. Configure `config.json` for bot settings (embed color, log channel, daily payout, etc) or use the /config command.
6. Start the bot with `node index.js`

## Config Options

| Name                        | Description                                                         | Default Setting |
|-----------------------------|---------------------------------------------------------------------|-----------------|
| `default_balance`           | The default amount of money a person gets when they enter the server| 0               |
| `log_channel_id`            | Channel ID for logging important actions                            | (none)          |
| `command_room`              | Channel ID where commands can be used                               | (none)          |
| `balance_per_message`       | Amount of money earned per message                                  | 0               |
| `messages_cooldown_secends` | Cooldown (in seconds) between earning money from messages           | 0               |
| `leaderboard_limit`         | Number of users shown in the leaderboard (Max 25!)                  | 10              |
| `daily_payout`              | Amount given for daily claim                                        | 0               |
| `embed_color`               | Hex color for all embed messages (e.g., `#FFFFFF`)                  | #FFFFFF       |
| `reward_room`               | Channel ID where item purchase notifications are sent               | (none)          |
| `reward_giver_id`           | Role ID to mention when an item is purchased                        | (none)          |

## Features

### Balance Management

- `/addbalance` — Add balance to a user
- `/removebalance` — Remove balance from a user
- `/balance` — Check your or another user's balance
- `/daily` — Claim a daily payout (configurable)
- `/leaderboard` — View the top users by balance
- `/buyitem` - Purchase an item from the shop
- `/giveaway` - Create a giveaway for points
- Earn money by sending messages (with cooldown)
- ~~(Planned) Earn money by inviting users~~

### Item & Shop Management

- `/createitem` — Create a new shop item (supports code-based or stock-based items)
- `/edititem` — Edit item details (name, description, price, stock)
- `/removeitem` — Remove an item and its codes from the shop
- `/addstock` — Add a code to an item's stock (for code-based items)
- `/shop` — View all items in the shop

### Bot Management

- `/config` — Change bot configuration (log channel, embed color, payouts, etc)

### Data Storage

- Uses SQLite for persistent storage of users and items
- Each item can have its own codes table for unique code stock

### Logging

- All important actions (balance changes, item changes, config updates) are logged to a configurable channel

## File Structure

- `index.js` — Main bot logic and event handling
- `commands/` — All slash command implementations
- `config.json` — Bot configuration
- `users.db` — User balances and daily tracking
- `items.db` — Shop items and item codes

## AI Usage

I used GitHub Copilot for code completions, wording, some SQLite queries, and bug understanding (not direct bug fixing, but understand the bugs).
