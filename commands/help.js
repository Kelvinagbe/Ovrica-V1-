// commands/help.js

const { templates } = require('../templates');

module.exports = {

    name: 'help',

    admin: false,

    description: 'Show all commands',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        const CONFIG = require('../config');

        const text = templates.help(isAdmin);

        await sendWithTyping(sock, from, { text });

    }

};