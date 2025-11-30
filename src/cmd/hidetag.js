// commands/hidetag.js

const { templates } = require('../tmp/templates');

module.exports = {

    name: 'hidetag',

    admin: false,

    description: 'Hidden tag all members',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        // Check if it's a group

        if (!from.endsWith('@g.us')) {

            const text = templates.error('This command can only be used in groups!');

            return await sendWithTyping(sock, from, { text });

        }

        

        if (args.length === 0) {

            const text = templates.error('Usage: /hidetag <message>\n\nExample: /hidetag Important announcement!');

            return await sendWithTyping(sock, from, { text });

        }

        

        try {

            const groupMetadata = await sock.groupMetadata(from);

            const participants = groupMetadata.participants;

            

            const message = args.join(' ');

            

            await sock.sendMessage(from, {

                text: message,

                mentions: participants.map(p => p.id)

            });

        } catch (error) {

            const text = templates.error('Failed to send hidden tag!');

            await sendWithTyping(sock, from, { text });

        }

    }

};