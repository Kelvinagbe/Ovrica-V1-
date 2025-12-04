const { templates } = require('../tmp/templates');

module.exports = {
    name: 'help',
    admin: false,
    description: 'Show all commands',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const CONFIG = require('@/config');
        const text = templates.help(isAdmin);

        await sendWithTyping(sock, from, { 
            text,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363418958316196@newsletter",
                    newsletterName: "🎭 Kelvin Tech",
                    serverMessageId: 200
                }
            }
        }, { quoted: msg }); // Added quoted reply here
    }
};