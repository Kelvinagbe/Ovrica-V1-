// commands/sticker.js

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

            // Send initial processing message
            const processingMsg = await sock.sendMessage(from, { 
                text: '⏳ *Processing...*\n\n▱▱▱▱▱▱▱▱▱▱ 0%' 
            });
            const msgKey = processingMsg.key;

            console.log('⬇️ Downloading media...');
            
            // Update: 20% - Downloading
            await sock.sendMessage(from, {
                text: '⏳ *Processing...*\n\n▰▰▱▱▱▱▱▱▱▱ 20%\nDownloading image...',
                edit: msgKey
            });
            
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

            // Update: 50% - Converting
            await sock.sendMessage(from, {
                text: '⏳ *Processing...*\n\n▰▰▰▰▰▱▱▱▱▱ 50%\nConverting to sticker...',
                edit: msgKey
            });

            console.log('🔄 Processing image with sharp...');
            
            // Process image to WebP sticker format
            const stickerBuffer = await sharp(mediaBuffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 100 })
                .toBuffer();
            
            // Update: 70% - Optimizing
            await sock.sendMessage(from, {
                text: '⏳ *Processing...*\n\n▰▰▰▰▰▰▰▱▱▱ 70%\nOptimizing quality...',
                edit: msgKey
            });
            
            console.log('✅ Sticker processed, size:', stickerBuffer.length);

            // Add EXIF metadata with pack info
            const Exif = require('node-webpmux');
            const exif = new Exif.Image();
            
            // Update: 85% - Adding metadata
            await sock.sendMessage(from, {
                text: '⏳ *Processing...*\n\n▰▰▰▰▰▰▰▰▰▱ 85%\nAdding metadata...',
                edit: msgKey
            });
            const json = {
                'sticker-pack-id': 'com.snowcorp.stickerly.android.stickercontentprovider',
                'sticker-pack-name': '𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                'sticker-pack-publisher': '𝐊𝐞𝐥𝐯𝐢𝐧',
                'android-app-store-link': 'https://github.com/Kelvinagbe/Ovrica-V1-',
                'ios-app-store-link': 'https://github.com/Kelvinagbe/Ovrica-V1-',
                'emojis': ['😀']
            };
            
            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
            const exifData = Buffer.concat([exifAttr, jsonBuffer]);
            exifData.writeUIntLE(jsonBuffer.length, 14, 4);
            
            await exif.load(stickerBuffer);
            exif.exif = exifData;
            const finalBuffer = await exif.save(null);

            // Update: 95% - Finalizing
            await sock.sendMessage(from, {
                text: '⏳ *Processing...*\n\n▰▰▰▰▰▰▰▰▰▰ 95%\nFinalizing...',
                edit: msgKey
            });

            // Send sticker
            await sock.sendMessage(from, {
                sticker: finalBuffer
            });
            
            // Update: 100% - Complete (then delete)
            await sock.sendMessage(from, {
                text: '✅ *Processing...*\n\n▰▰▰▰▰▰▰▰▰▰ 100%\nComplete!',
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
            
            console.log('✅ Sticker sent successfully');

        } catch (error) {
            console.error('❌ Sticker creation failed:', error);
            
            const errorMsg = `❌ *Sticker Creation Failed*\n\n` +
                `*Error:* ${error.message}\n\n` +
                `*Common fixes:*\n` +
                `• Make sure you replied to an IMAGE\n` +
                `• Image size should be under 5MB\n` +
                `• Try with a different image\n` +
                `• Check if sharp and node-webpmux are installed`;
            
            await sendWithTyping(sock, from, { text: errorMsg });
        }
    }
};