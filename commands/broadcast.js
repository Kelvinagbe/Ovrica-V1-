// commands/broadcast.js

const { templates } = require('../templates');

function getBotInfo(config) {

    return {

        name: 'OVRICA-V1',

        owner: 'KELVIN AGBE',

        version: '1.0.0',

        mode: config.mode || 'Public'

    };

}

module.exports = {

    name: 'broadcast',

    admin: true,

    description: 'Broadcast message to all chats',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        const CONFIG = require('../config');

        if (args.length === 0) {

            const text = templates.error('Usage: /broadcast <message>\n\nExample: /broadcast Server maintenance at 10 PM');

            return await sendWithTyping(sock, from, { text });

        }

        

        const messageQueue = require('../index').messageQueue;

        const message = args.join(' ');

        const chats = Array.from(messageQueue.keys());

        

        await sendWithTyping(sock, from, { 

            text: templates.simpleText.broadcastStart(chats.length, getBotInfo(CONFIG))

        });

        

        let success = 0;

        for (const jid of chats) {

            try {

                await sock.sendMessage(jid, {

                    text: templates.simpleText.broadcast(message, getBotInfo(CONFIG))

                });

                success++;

                await new Promise(r => setTimeout(r, 1000));

            } catch (e) {

                // Skip failed sends

            }

        }

        

        const rate = ((success / chats.length) * 100).toFixed(1);

        const text = templates.simpleText.broadcastComplete(success, chats.length, rate, getBotInfo(CONFIG));

        await sendWithTyping(sock, from, { text });

    }

};