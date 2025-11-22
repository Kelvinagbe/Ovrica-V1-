// commands/sticker.js

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const { templates } = require('../templates');

module.exports = {

    name: 'sticker',

    admin: false,

    description: 'Convert image to sticker',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted?.imageMessage) {

            const text = templates.error('Reply to an image with /sticker\n\nHow to use:\n1. Find an image\n2. Reply to it\n3. Type /sticker');

            return await sendWithTyping(sock, from, { text });

        }

        

        await sendWithTyping(sock, from, { text: templates.simpleText.stickerCreating });

        

        try {

            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});

            await sock.sendMessage(from, {

                sticker: buffer,

                packname: '🤖 OVRICA-V1',

                author: '🎭 Kelvin'

            });

        } catch (error) {

            const text = templates.error('Failed to create sticker\n\nPossible reasons:\n- Image too large\n- Invalid format\n- Network error');

            await sendWithTyping(sock, from, { text });

        }

    }

};