// commands/tagall.js

const { templates } = require('../tmp/templates');

module.exports = {

    name: 'tagall',

    admin: true,

    description: 'Tag all group members',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        // Check if it's a group

        if (!from.endsWith('@g.us')) {

            const text = templates.error('This command can only be used in groups!');

            return await sendWithTyping(sock, from, { text });

        }

        

        try {

            const groupMetadata = await sock.groupMetadata(from);

            const participants = groupMetadata.participants;

            

            const message = args.length > 0 ? args.join(' ') : 'Hey everyone!';

            

            let tagMessage = `┌ ❏ *⌜ TAG ALL ⌟* ❏\n│\n├◆ ${message}\n│\n`;

            

            participants.forEach((participant, index) => {

                tagMessage += `├◆ @${participant.id.split('@')[0]}\n`;

            });

            

            tagMessage += '└ ◆\n> Powered by 🎭Kelvin🎭';

            

            await sock.sendMessage(from, {

                text: tagMessage,

                mentions: participants.map(p => p.id)

            });

        } catch (error) {

            const text = templates.error('Failed to tag members. Make sure bot is admin!');

            await sendWithTyping(sock, from, { text });

        }

    }

};