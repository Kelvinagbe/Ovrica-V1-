// commands/vv.js - View Once Media Revealer (Fixed detection)

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'vv',
    admin: false,
    description: 'Reveal view once images and videos',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Check if replying to a message
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const quotedMsg = contextInfo?.quotedMessage;

            if (!quotedMsg) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ VIEW ONCE REVEALER ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 👀 *How to use:*\n` +
                        `├◆ 1. Reply to view once photo/video\n` +
                        `├◆ 2. Type: /vv\n` +
                        `├◆ 3. Bot reveals it!\n` +
                        `│\n` +
                        `├◆ ⚠️ Don't open before using /vv\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            console.log('📱 Analyzing quoted message...');
            console.log('Available keys:', Object.keys(quotedMsg));
            
            // Check all possible view once message formats
            let viewOnceMsg = null;
            let viewOnceType = null;

            // Method 1: viewOnceMessageV2 (most common)
            if (quotedMsg.viewOnceMessageV2) {
                viewOnceMsg = quotedMsg.viewOnceMessageV2.message;
                viewOnceType = 'V2';
                console.log('✅ Detected: viewOnceMessageV2');
            }
            // Method 2: viewOnceMessageV2Extension
            else if (quotedMsg.viewOnceMessageV2Extension) {
                viewOnceMsg = quotedMsg.viewOnceMessageV2Extension.message;
                viewOnceType = 'V2Extension';
                console.log('✅ Detected: viewOnceMessageV2Extension');
            }
            // Method 3: viewOnceMessage (older format)
            else if (quotedMsg.viewOnceMessage) {
                viewOnceMsg = quotedMsg.viewOnceMessage.message;
                viewOnceType = 'V1';
                console.log('✅ Detected: viewOnceMessage');
            }

            if (!viewOnceMsg) {
                console.log('❌ No view once message detected');
                console.log('Message structure:', JSON.stringify(Object.keys(quotedMsg), null, 2));
                
                return await sock.sendMessage(from, {
                    text: `❌ *Not a view once message!*\n\n` +
                        `This appears to be a regular message.\n\n` +
                        `📝 View once messages have a special icon:\n` +
                        `• 1️⃣ with a circle around it\n` +
                        `• Says "View once" when you receive it\n\n` +
                        `💡 Make sure you:\n` +
                        `• Reply to actual view once photo/video\n` +
                        `• Haven't opened it yet\n` +
                        `• Don't forward, use reply button`
                }, { quoted: msg });
            }

            console.log('🔍 View once content keys:', Object.keys(viewOnceMsg));

            // Check if it's image or video
            const isImage = !!viewOnceMsg.imageMessage;
            const isVideo = !!viewOnceMsg.videoMessage;

            console.log('Media type - Image:', isImage, 'Video:', isVideo);

            if (!isImage && !isVideo) {
                console.log('❌ Unsupported view once type');
                console.log('Content:', Object.keys(viewOnceMsg));
                
                return await sock.sendMessage(from, {
                    text: `❌ *Unsupported view once type!*\n\n` +
                        `✅ Supported:\n` +
                        `• View once photos\n` +
                        `• View once videos\n\n` +
                        `❌ Not supported:\n` +
                        `• Other media types\n\n` +
                        `Content detected: ${Object.keys(viewOnceMsg).join(', ')}`
                }, { quoted: msg });
            }

            const mediaType = isImage ? 'image' : 'video';
            const sender = contextInfo.participant || from;
            const senderNumber = sender.split('@')[0];
            const senderName = msg.pushName || 'Unknown';

            // Send processing message
            const processingMsg = await sock.sendMessage(from, {
                text: `⏳ *Revealing view once ${mediaType}...*\n\n` +
                    `👤 From: ${senderName}\n` +
                    `📱 Number: +${senderNumber}\n` +
                    `📝 Type: ${viewOnceType}`
            }, { quoted: msg });

            console.log(`👀 Revealing ${mediaType} (${viewOnceType}) from ${senderName}`);

            try {
                // Get the media message
                const mediaMsg = isImage ? viewOnceMsg.imageMessage : viewOnceMsg.videoMessage;
                
                console.log('📥 Downloading media...');

                // Download the media
                const buffer = await downloadMediaMessage(
                    { 
                        message: viewOnceMsg
                    },
                    'buffer',
                    {}
                );

                const sizeKB = (buffer.length / 1024).toFixed(2);
                console.log(`✅ Downloaded: ${sizeKB} KB`);

                // Get caption if exists
                const originalCaption = mediaMsg.caption || '';

                // Build reveal message
                const caption = 
                    `┌ ❏ *⌜ VIEW ONCE REVEALED ⌟* ❏\n` +
                    `│\n` +
                    `├◆ 👀 *Successfully Revealed!*\n` +
                    `├◆ 📝 *Type:* ${mediaType.toUpperCase()}\n` +
                    `├◆ 👤 *From:* ${senderName}\n` +
                    `├◆ 📱 *Number:* +${senderNumber}\n` +
                    `├◆ 📦 *Size:* ${sizeKB} KB\n` +
                    (originalCaption ? `├◆ 💬 *Caption:* ${originalCaption}\n` : '') +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true })}\n` +
                    `│\n` +
                    `├◆ ✅ Here's what they sent!\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                // Send the revealed media
                if (mediaType === 'image') {
                    await sock.sendMessage(from, {
                        image: buffer,
                        caption: caption
                    });
                } else {
                    await sock.sendMessage(from, {
                        video: buffer,
                        caption: caption
                    });
                }

                // Update processing message
                await sock.sendMessage(from, {
                    text: `✅ *View once ${mediaType} revealed!*\n\n` +
                        `📦 Size: ${sizeKB} KB\n` +
                        `👤 From: ${senderName}`,
                    edit: processingMsg.key
                });

                console.log(`✅ Successfully revealed ${mediaType}`);

            } catch (downloadError) {
                console.error('❌ Download error:', downloadError);
                throw new Error(`Download failed: ${downloadError.message}`);
            }

        } catch (error) {
            console.error('❌ View once reveal error:', error);
            console.error('Stack:', error.stack);

            let errorMsg = error.message;
            let errorSolution = 'Try again';

            if (error.message.includes('download') || error.message.includes('404')) {
                errorMsg = 'Media download failed';
                errorSolution = 'View once was already opened or expired';
            } else if (error.message.includes('400')) {
                errorMsg = 'Invalid message';
                errorSolution = 'Not a valid view once message';
            } else if (error.message.includes('decrypt')) {
                errorMsg = 'Decryption failed';
                errorSolution = 'Message already viewed or corrupted';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to reveal*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `├◆ 🔧 *Reasons:*\n` +
                    `├◆    • Already opened (most common)\n` +
                    `├◆    • Message expired (>14 days)\n` +
                    `├◆    • Not a view once message\n` +
                    `├◆    • Corrupted/deleted media\n` +
                    `│\n` +
                    `├◆ 💡 *Tip:*\n` +
                    `├◆    Reply BEFORE opening it!\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};