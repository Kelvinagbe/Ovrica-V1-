const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

module.exports = {
    name: 'toimage',
    aliases: ['toimg', 'stickertoimage', 'topng'],
    admin: false,
    description: 'Convert sticker to image',

    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        console.log('🖼️ Sticker to Image command triggered');

        try {
            // Get quoted message - multiple fallback methods
            let quoted = null;

            // Method 1: Standard quoted message
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            }

            // Method 2: Direct extended text
            if (!quoted && msg.extendedTextMessage?.contextInfo?.quotedMessage) {
                quoted = msg.extendedTextMessage.contextInfo.quotedMessage;
            }

            console.log('📩 Quoted message found:', !!quoted);
            console.log('🎭 Has sticker:', !!quoted?.stickerMessage);

            // Check if sticker exists
            if (!quoted || !quoted.stickerMessage) {
                const errorMsg = `❌ *Error: No Sticker Found*\n\n` +
                    `*How to use:*\n` +
                    `1️⃣ Send or forward a sticker\n` +
                    `2️⃣ Reply to that sticker\n` +
                    `3️⃣ Type: /toimage\n\n` +
                    `*Example:*\n` +
                    `[Sticker] ← Reply to this\n` +
                    `/toimage`;

                return await sendWithTyping(sock, from, { text: errorMsg });
            }

            // Send initial processing message
            const processingMsg = await sock.sendMessage(from, { 
                text: '⏳ *Converting...*\n\n▱▱▱▱▱▱▱▱▱▱ 0%' 
            });
            const msgKey = processingMsg.key;

            console.log('⬇️ Downloading sticker...');

            // Update: 20% - Downloading
            await sock.sendMessage(from, {
                text: '⏳ *Converting...*\n\n▰▰▱▱▱▱▱▱▱▱ 20%\nDownloading sticker...',
                edit: msgKey
            });

            // Download sticker with proper configuration
            const mediaBuffer = await downloadMediaMessage(
                { message: quoted },
                'buffer',
                {},
                {
                    logger: {
                        level: 'error',
                        log: (level, msg) => console.log(level, msg)
                    },
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            console.log('✅ Sticker downloaded, size:', mediaBuffer?.length);

            if (!mediaBuffer || mediaBuffer.length === 0) {
                throw new Error('Downloaded sticker is empty');
            }

            // Update: 50% - Converting
            await sock.sendMessage(from, {
                text: '⏳ *Converting...*\n\n▰▰▰▰▰▱▱▱▱▱ 50%\nConverting to image...',
                edit: msgKey
            });

            console.log('🔄 Processing sticker with sharp...');

            // Convert WebP sticker to PNG image
            const imageBuffer = await sharp(mediaBuffer)
                .png({
                    quality: 100,
                    compressionLevel: 6
                })
                .toBuffer();

            // Update: 70% - Optimizing
            await sock.sendMessage(from, {
                text: '⏳ *Converting...*\n\n▰▰▰▰▰▰▰▱▱▱ 70%\nOptimizing quality...',
                edit: msgKey
            });

            console.log('✅ Image processed, size:', imageBuffer.length);

            // Update: 90% - Finalizing
            await sock.sendMessage(from, {
                text: '⏳ *Converting...*\n\n▰▰▰▰▰▰▰▰▰▱ 90%\nFinalizing...',
                edit: msgKey
            });

            // Send image
            await sock.sendMessage(from, {
                image: imageBuffer,
                caption: '✅ *Sticker converted to image!*'
            });

            // Update: 100% - Complete (then delete)
            await sock.sendMessage(from, {
                text: '✅ *Converting...*\n\n▰▰▰▰▰▰▰▰▰▰ 100%\nComplete!',
                edit: msgKey
            });

            // Delete the progress message after 2 seconds
            setTimeout(async () => {
                try {
                    await sock.sendMessage(from, { delete: msgKey });
                } catch (err) {
                    console.log('Could not delete message:', err.message);
                }
            }, 2000);

            console.log('✅ Image sent successfully');

        } catch (error) {
            console.error('❌ Conversion failed:', error);

            const errorMsg = `❌ *Conversion Failed*\n\n` +
                `*Error:* ${error.message}\n\n` +
                `*Common fixes:*\n` +
                `• Make sure you replied to a STICKER\n` +
                `• Sticker should be valid WebP format\n` +
                `• Try with a different sticker\n` +
                `• Check if sharp is properly installed`;

            await sendWithTyping(sock, from, { text: errorMsg });
        }
    }
};