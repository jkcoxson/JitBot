// Jackson Coxson

const config = require('../config.json');

/**
 * 
 * @param {import('discord.js').GuildMember} member A guild member
 * @returns {boolean} Whether the member has the correct permissions
 */
function check_mod(member) {
    // Check if the member has the moderator role
    let found = false;
    member.roles.cache.forEach(role => {
        if (role.name == 'Moderator') {
            found = true;
        }
        if (role.name == 'Administrator') {
            found = true;
        }
    });
    return found;
}
exports.check_mod = check_mod;
