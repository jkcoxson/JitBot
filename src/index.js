// Jackson Coxson

const config = require('../config.json');
const register = require('./register');
const permission = require('./permission');

const discord = require('discord.js');
const http = require('http');

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
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('You do not have permission to use this command')
                        .setColor('#ff0000');
                    interaction.reply({
                        embeds: [embed],
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

                let embed = new discord.MessageEmbed()
                    .setTitle('Success')
                    .setDescription('Tag added')
                    .setColor('#00ff00');

                interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                break;
            }
            case 'remove_tag': {
                // Check for permission
                if (!permission.check_mod(interaction.member)) {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('You do not have permission to use this command')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
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

                    let embed = new discord.MessageEmbed()
                        .setTitle('Success')
                        .setDescription('Tag removed')
                        .setColor('#00ff00');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                } else {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('Tag not found')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
                break;
            }
            case 'rule': {
                let rules = require('./rules.json');
                let rule = rules[interaction.options.getInteger('number').toString()];
                if (rule) {
                    let title = rule.split('\n')[0];
                    let content = rule.split('\n')[1];
                    let embed = new discord.MessageEmbed()
                        .setTitle(title)
                        .setDescription(content)
                        .setColor('#0000FF');

                    interaction.reply({
                        embeds: [embed]
                    });
                } else {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('Rule not found')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
                break;
            }
            case 'mute': {
                // Check for permission
                if (!permission.check_mod(interaction.member)) {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('You do not have permission to use this command')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                let user = interaction.options.getUser('user');
                if (user) {
                    let muted = require('./muted.json');
                    let currentTime = new Date().getTime();
                    let muteTime = interaction.options.getInteger('time') * 60000;
                    let muteEnd = currentTime + muteTime;

                    let ruleNumber = interaction.options.getInteger('rule');
                    let rule = require('./rules.json')[ruleNumber];
                    if (!rule) {
                        let embed = new discord.MessageEmbed()
                            .setTitle('Error')
                            .setDescription('Rule not found')
                            .setColor('#ff0000');

                        interaction.reply({
                            embeds: [embed],
                            ephemeral: true
                        });
                        return;
                    }


                    muted.push({
                        user: user.id,
                        end: muteEnd
                    });
                    require('fs').writeFileSync('src/muted.json', JSON.stringify(muted, null, 4));

                    // Give the user the mute role
                    let guild = interaction.guild;
                    let muteRole = guild.roles.cache.find(role => role.name === 'Muted');
                    let member = guild.members.cache.find(member => member.id === user.id);
                    if (member) {
                        member.roles.add(muteRole);
                    }

                    let timeString = "";
                    if (interaction.options.getInteger('time')) {
                        timeString = interaction.options.getInteger('time');
                    } else {
                        timeString = 'indefinite';
                    }
                    let embed = new discord.MessageEmbed()
                        .setTitle(user.username + ' has been muted for ' + timeString + ' hours')
                        .setDescription(rule)
                        .setColor('#0000FF');

                    interaction.reply({
                        embeds: [embed],
                        content: '<@' + user.id + '>',
                        ephemeral: false
                    });
                } else {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('User not found')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
                break;
            }
            case 'ban': {
                // Check for permission
                if (!permission.check_mod(interaction.member)) {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('You do not have permission to use this command')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                let ruleNumber = interaction.options.getInteger('rule');
                let rule = require('./rules.json')[ruleNumber];
                if (!rule) {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('Rule not found')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                    return;
                }

                let user = interaction.options.getUser('user');
                let member = interaction.guild.members.cache.find(member => member.id === user.id);
                let mutedRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
                let moderatorRole = interaction.guild.roles.cache.find(role => role.name === 'Moderator');

                member.roles.add(mutedRole);

                let embed = new discord.MessageEmbed()
                    .setTitle(interaction.member.displayName + ' has requested a ban on ' + user.username)
                    .setDescription(rule)
                    .setColor('#0000FF');

                let row = new discord.MessageActionRow()
                    .addComponents(new discord.MessageButton()
                        .setCustomId(JSON.stringify({
                            command: 'ban',
                            action: 'approve',
                            user: user.id,
                            mod: interaction.member.id
                        })).setLabel('Approve').setStyle('PRIMARY'))
                    .addComponents(new discord.MessageButton()
                        .setCustomId(JSON.stringify({
                            command: 'ban',
                            action: 'deny',
                            user: user.id,
                            mod: interaction.member.id
                        })).setLabel('Deny').setStyle('DANGER'));

                interaction.reply({
                    content: '<@' + user.id + '>, <@&' + moderatorRole.id + '>',
                    embeds: [embed],
                    components: [row]
                });
                break;
            }
            case 'status': {
                let anyFailures = false;
                let members = 0;
                interaction.guild.members.fetch().then(fetchedMembers => {
                    members = fetchedMembers.size;
                });

                let toSend = '__**Discord Bot:**__ :green_circle:\n';
                toSend += 'Users: ' + members + '\n';

                let currentTime = new Date().getTime();
                toSend += 'Response Time: ' + (currentTime - interaction.createdTimestamp) + 'ms\n';

                // Check the status of the JitStreamer http server
                const options = {
                    hostname: 'jitstreamer.com',
                    port: 80,
                    path: '/version/',
                    method: 'GET',
                };

                const req = http.request(options, res => {
                    console.log(`statusCode: ${res.statusCode}`);

                    res.on('data', d => {
                        toSend += '__**JitStreamer:**__ :green_circle:\n';
                        toSend += 'Version: ' + d.toString() + '\n';

                        let new_time = new Date().getTime();
                        toSend += 'Response Time: ' + (new_time - currentTime) + 'ms\n';

                        let embed = new discord.MessageEmbed()
                            .setTitle('Server Status')
                            .setDescription(toSend)
                            .setColor('#00FF00');

                        interaction.reply({
                            embeds: [embed],
                            ephemeral: false
                        });
                        return;
                    });
                });

                req.on('error', error => {
                    toSend += '\n__**JitStreamer:**__ :red_circle:\n';
                    toSend += error.toString() + '\n';

                    let embed = new discord.MessageEmbed()
                        .setTitle('Server Status')
                        .setDescription(toSend)
                        .setColor('#FF0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: false
                    });
                });

                req.end();
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
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('Tag not found')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
            }
        }
    }

    if (interaction.isButton()) {
        let data = JSON.parse(interaction.customId);
        switch (data.command) {
            case 'ban': {
                // Check for permission
                if (!permission.check_mod(interaction.member)) {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('You do not have permission to use this command')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                // Check if the approver is the original moderator
                if (data.mod == interaction.member.id) {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('You cannot approve or deny your own ban')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                    return;
                }

                let member = interaction.guild.members.cache.find(member => member.id === data.user);
                if (!member) {
                    let embed = new discord.MessageEmbed()
                        .setTitle('Error')
                        .setDescription('User not found')
                        .setColor('#ff0000');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                    return;
                }

                if (data.action === 'approve') {
                    member.ban();
                    let embed = new discord.MessageEmbed()
                        .setTitle('Ban approved by ' + interaction.member.displayName)
                        .setDescription(member.displayName + ' has been banned')
                        .setColor('#0000FF');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: false
                    });
                }
                if (data.action === 'deny') {
                    // Unmute the user
                    let mutedRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
                    member.roles.remove(mutedRole);

                    let embed = new discord.MessageEmbed()
                        .setTitle('Ban denied by ' + interaction.member.displayName)
                        .setDescription('Ban request denied')
                        .setColor('#0000FF');

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: false
                    });
                    return;
                }
                break;
            }
        }
    }
});

setInterval(() => {
    let muted = require('./muted.json');
    let currentTime = new Date().getTime();

    muted.forEach(user => {
        if (user.end < currentTime) {
            let guild = client.guilds.cache.get(config.guild);
            let muteRole = guild.roles.cache.find(role => role.name === 'Muted');
            let member = guild.members.cache.find(member => member.id === user.user);
            if (member) {
                member.roles.cache.delete(muteRole);
            }
        }
    });

    muted = muted.filter(mute => mute.end > currentTime);
    require('fs').writeFileSync('src/muted.json', JSON.stringify(muted, null, 4));

}, 1000);
