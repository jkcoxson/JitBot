// Jackson Coxson

const config = require('../config.json');

const discord = require('discord.js');

const client = new discord.Client({ intents: [discord.Intents.FLAGS.GUILDS] });
client.login(config.token);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
