// Jackson Coxson

const config = require('../config.json');

const discord = require('discord.js');

const client = new discord.Client({ intents: [discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MESSAGES] });
client.login(config.token);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
    // Predetermined responses
    switch (message.content.toLocaleLowerCase().trim()) {
        case 'good bot': {
            message.reply('I know I am');
        }
        case 'bad bot': {
            message.reply('Am not smh');
        }
    }

    // Ensure no P*thon is allowed
    if (message.content.includes('Python')) {
        message.channel.send('No P*thon allowed!');
    }
});
