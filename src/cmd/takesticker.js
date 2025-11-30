// commands/takesticker.js

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

module.exports = {
    name: 'take',
    aliases: ['steal', 'grab'],
    admin: false,
    description: 'Take a sticker and re-pack it with custom name',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        console.log('🎯 Take sticker command triggered');
        
        try {
            // Get quoted message
            let quoted = null;
            
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            }
            
            if (!quoted && msg.extendedTextMessage?.contextInfo?.quotedMessage) {
                quoted = msg.extendedTextMessage.contextInfo.quotedMessage;
            }
            
            console.log('📩 Quoted message found:', !!quoted);
            console.log('🎯 Has sticker:', !!quoted?.stickerMessage);
            
            // Check if sticker exists
            if (!quoted || !quoted.stickerMessage) {
                const errorMsg = `❌ *Error: No Sticker Found*\n\n` +
                    `*How to use:*\n` +
                    `1️⃣ Reply to any sticker\n` +
                    `2️⃣ Type: /take YourName|AuthorName\n` +
                    `   Or just: /take (uses default)\n\n` +
                    `*Examples:*\n` +
                    `• /take\n` +
                    `• /take My Pack|By Me\n` +
                    `• /take Cool Stickers|John\n\n` +
                    `*Aliases:* /take, /steal, /grab`;
                
                return await sendWithTyping(sock, from, { text: errorMsg });
            }

            // Parse custom pack name and author
            let packName = '𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏';
            let authorName = '𝐊𝐞𝐥𝐯𝐢𝐧';
            
            if (args.length > 0) {
                const input = args.join(' ');
                const parts = input.split('|');
                
                if (parts.length === 2) {
                    packName = parts[0].trim() || packName;
                    authorName = parts[1].trim() || authorName;
                } else if (parts.length === 1) {
                    packName = parts[0].trim() || packName;
                }
            }

            // Send processing message
            const processingMsg = `⏳ *Taking sticker...*\n\n` +
                `📦 Pack: ${packName}\n` +
                `✍️ Author: ${authorName}`;
            await sendWithTyping(sock, from, { text: processingMsg });

            console.log('⬇️ Downloading sticker...');
            
            // Download sticker
            const stickerBuffer = await downloadMediaMessage(
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
            
            console.log('✅ Sticker downloaded, size:', stickerBuffer?.length);

            if (!stickerBuffer || stickerBuffer.length === 0) {
                throw new Error('Downloaded sticker is empty');
            }

            console.log('🔄 Processing sticker...');
            
            // Re-process the sticker to ensure proper format
            const processedBuffer = await sharp(stickerBuffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 100 })
                .toBuffer();
            
            console.log('✅ Sticker processed');

            // Send sticker with custom pack info
            await sock.sendMessage(from, {
                sticker: processedBuffer,
                packname: packName,
                author: authorName
            });

            // Send success message
            const successMsg = `✅ *Sticker Taken Successfully!*\n\n` +
                `📦 *Pack:* ${packName}\n` +
                `✍️ *Author:* ${authorName}\n\n` +
                `💡 *Tip:* Now you can add this to your WhatsApp favorites!\n` +
                `⭐ Long press the sticker → Add to Favorites`;
            
            await sendWithTyping(sock, from, { text: successMsg });
            
            console.log('✅ Sticker taken and sent successfully');

        } catch (error) {
            console.error('❌ Take sticker failed:', error);
            
            const errorMsg = `❌ *Failed to Take Sticker*\n\n` +
                `*Error:* ${error.message}\n\n` +
                `*Common fixes:*\n` +
                `• Make sure you replied to a STICKER\n` +
                `• Try with a different sticker\n` +
                `• Check if sharp is installed`;
            
            await sendWithTyping(sock, from, { text: errorMsg });
        }
    }
};