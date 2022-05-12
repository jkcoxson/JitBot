// Jackson Coxson

const config = require('../config.json');
const register = require('./register');
const permission = require('./permission');

const discord = require('discord.js');

const client = new discord.Client({ intents: [discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MESSAGES] });
client.login(config.token);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    register.register(client);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    // Predetermined responses
    switch (message.content.toLocaleLowerCase().trim()) {
        case 'good bot': {
            message.reply('I know I am');
            break;
        }
        case 'bad bot': {
            message.reply('Am not smh');
            break;
        }
        case 'no you': {
            message.reply('no you');
            break;
        }
        case 'no u': {
            message.reply('no u');
            break;
        }
    }

    // Ensure no P*thon is allowed
    if (message.content.includes('Python')) {
        message.channel.send('No P*thon allowed!');
    }
    if (message.content.includes('python') && (message.content.includes('program') || message.content.includes('code') || message.content.includes('script'))) {
        message.channel.send('No P*thon allowed!');
    }

    // Randomly respond to messages
    if (Math.random() < 0.01) {
        message.channel.send('You are insecure');
    }
});

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) {
        switch (interaction.commandName) {
            case 'add_tag': {
                // Check for permission
                if (!permission.check_mod(interaction.member)) {
                    interaction.reply({
                        content: 'You do not have permission to use this command.',
                        ephemeral: true
                    });
                    return;
                }

                let commands = require('./commands.json');
                let newCommand = {
                    name: interaction.options.getString('name'),
                    description: 'A tag with a pregenerated response'
                }
                commands.push(newCommand);

                // Add the tag to the remove_tag command
                let removeCommand = commands.find(command => command.name === 'remove_tag');
                removeCommand.options[0].choices.push({
                    name: newCommand.name,
                    value: newCommand.name
                });

                // Save config
                require('fs').writeFileSync('src/commands.json', JSON.stringify(commands, null, 4));

                // Add tag to the database
                let tags = require('./tags.json');
                tags.push({
                    tag: interaction.options.getString('name'),
                    response: interaction.options.getString('response')
                })
                require('fs').writeFileSync('src/tags.json', JSON.stringify(tags, null, 4));

                register.register(client);

                interaction.reply({
                    content: 'Tag added!',
                    ephemeral: true
                });
                break;
            }
            case 'remove_tag': {
                // Check for permission
                if (!permission.check_mod(interaction.member)) {
                    interaction.reply({
                        content: 'You do not have permission to use this command.',
                        ephemeral: true
                    });
                    return;
                }

                let commands = require('./commands.json');
                let tag = interaction.options.getString('tag');
                let command = commands.find(command => command.name === tag);
                if (command) {
                    commands = commands.filter(command => command.name !== tag);

                    // Remove the tag from the remove_tag command
                    let removeCommand = commands.find(command => command.name === 'remove_tag');
                    removeCommand.options[0].choices = removeCommand.options[0].choices.filter(choice => choice.value !== tag);

                    require('fs').writeFileSync('src/commands.json', JSON.stringify(commands, null, 4));

                    // Remove tag from the database
                    let tags = require('./tags.json');
                    tags = tags.filter(tag => tag.tag !== tag);
                    require('fs').writeFileSync('src/tags.json', JSON.stringify(tags, null, 4));

                    register.register(client);

                    interaction.reply({
                        content: 'Tag removed!',
                        ephemeral: true
                    });
                } else {
                    interaction.reply({
                        content: 'Tag not found!',
                        ephemeral: true
                    });
                }
                break;
            }
            case 'rule': {
                let rules = require('./rules.json');
                let rule = rules[interaction.options.getInteger('number').toString()];
                if (rule) {
                    interaction.reply({
                        content: rule,
                        ephemeral: false
                    });
                } else {
                    interaction.reply({
                        content: 'Rule not found!',
                        ephemeral: true
                    });
                }
                break;
            }
            default: {
                // Search for a tag
                let tags = require('./tags.json');
                let tag = tags.find(tag => tag.tag === interaction.commandName);
                if (tag) {
                    interaction.reply({
                        content: tag.response,
                        ephemeral: false
                    });
                } else {
                    interaction.reply({
                        content: 'Tag not found!',
                        ephemeral: true
                    });
                }
            }
        }
    }
});
