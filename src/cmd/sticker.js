const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { templates } = require('../tmp/templates');

module.exports = {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    admin: false,
    description: 'Convert image to sticker',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        console.log('🎨 Sticker command triggered');
        
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
            console.log('🖼️ Has image:', !!quoted?.imageMessage);
            
            // Check if image exists
            if (!quoted || !quoted.imageMessage) {
                const errorMsg = `❌ *Error: No Image Found*\n\n` +
                    `*How to use:*\n` +
                    `1️⃣ Send or forward an image\n` +
                    `2️⃣ Reply to that image\n` +
                    `3️⃣ Type: /sticker\n\n` +
                    `*Example:*\n` +
                    `[Image] ← Reply to this\n` +
                    `/sticker`;
                
                return await sendWithTyping(sock, from, { text: errorMsg });
            }

            // Send processing message
            const processingMsg = `⏳ *Creating sticker...*\n\nPlease wait a moment...`;
            await sendWithTyping(sock, from, { text: processingMsg });

            console.log('⬇️ Downloading media...');
            
            // Download image with proper configuration
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
            
            console.log('✅ Media downloaded, size:', mediaBuffer?.length);

            if (!mediaBuffer || mediaBuffer.length === 0) {
                throw new Error('Downloaded media is empty');
            }

            console.log('🔄 Processing image with sharp...');
            
            // Process image to WebP sticker format
            const stickerBuffer = await sharp(mediaBuffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 100 })
                .toBuffer();
            
            console.log('✅ Sticker processed, size:', stickerBuffer.length);

            // Send sticker with fancy name
            await sock.sendMessage(from, {
                sticker: stickerBuffer,
                packname: '𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                author: '🎭 Kelvin'
            });
            
            console.log('✅ Sticker sent successfully');

        } catch (error) {
            console.error('❌ Sticker creation failed:', error);
            
            const errorMsg = `❌ *Sticker Creation Failed*\n\n` +
                `*Error:* ${error.message}\n\n` +
                `*Common fixes:*\n` +
                `• Make sure you replied to an IMAGE\n` +
                `• Image size should be under 5MB\n` +
                `• Try with a different image\n` +
                `• Check if sharp is installed: \`npm install sharp\``;
            
            await sendWithTyping(sock, from, { text: errorMsg });
        }
    }
};