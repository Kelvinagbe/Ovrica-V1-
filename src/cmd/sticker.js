const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { templates } = require('../tmp/templates');

module.exports = {
    name: 'sticker',
    admin: false,
    description: 'Convert image to sticker',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Better way to get quoted message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
        const quoted = quotedMsg?.quotedMessage;

        if (!quoted || !quoted.imageMessage) {
            const text = templates.error('Reply to an image with /sticker\n\nHow to use:\n1. Find an image\n2. Reply to it\n3. Type /sticker');
            return await sendWithTyping(sock, from, { text });
        }

        await sendWithTyping(sock, from, { text: templates.simpleText.stickerCreating });

        try {
            // Download the image
            const buffer = await downloadMediaMessage(
                { message: quoted },
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            // Send as sticker
            await sock.sendMessage(from, {
                sticker: buffer,
                packname: '🤖 OVRICA-V1',
                author: '🎭 Kelvin'
            });

        } catch (error) {
            console.error('Sticker creation error:', error);
            const text = templates.error(`Failed to create sticker\n\nError: ${error.message}\n\nPossible reasons:\n- Image too large\n- Invalid format\n- Network error\n- Missing sharp library`);
            await sendWithTyping(sock, from, { text });
        }
    }
};