// Jackson Coxson

const config = require('../config.json');

/**
 * 
 * @param {import('discord.js').Client} client The Discord client
 */
function register(client) {
    // Register all commands
    const commands = require('./commands.json');
    let commandNames = [];
    commands.forEach(command => {
        client.guilds.cache.get(config.guild).commands.create(command);
        commandNames.push(command.name);
    });

    // Remove commands that are no longer in the config
    client.guilds.cache.get(config.guild).commands.fetch().then(commands => {
        commands.forEach(command => {
            if (!commandNames.includes(command.name)) {
                console.log(`Removing command ${command.name}`);
                command.delete();
            }
        });
    });
}

exports.register = register;