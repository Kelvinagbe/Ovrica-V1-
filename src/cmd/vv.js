const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'vv',
    admin: false,
    description: 'Reveal view once images and videos',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Check if replying to a message
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

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

            // Extract view once message (latest Baileys format)
            let viewOnceMsg = null;
            
            if (quotedMsg.viewOnceMessageV2?.message) {
                viewOnceMsg = quotedMsg.viewOnceMessageV2.message;
            } else if (quotedMsg.viewOnceMessageV2Extension?.message) {
                viewOnceMsg = quotedMsg.viewOnceMessageV2Extension.message;
            } else if (quotedMsg.viewOnceMessage?.message) {
                viewOnceMsg = quotedMsg.viewOnceMessage.message;
            }

            if (!viewOnceMsg) {
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

            // Check media type
            const isImage = !!viewOnceMsg.imageMessage;
            const isVideo = !!viewOnceMsg.videoMessage;

            if (!isImage && !isVideo) {
                return await sock.sendMessage(from, {
                    text: `❌ *Unsupported view once type!*\n\n` +
                        `✅ Supported:\n` +
                        `• View once photos\n` +
                        `• View once videos\n\n` +
                        `❌ Not supported:\n` +
                        `• Other media types`
                }, { quoted: msg });
            }

            const mediaType = isImage ? 'image' : 'video';
            const contextInfo = msg.message.extendedTextMessage.contextInfo;
            const sender = contextInfo.participant || from;
            const senderNumber = sender.split('@')[0];
            const senderName = msg.pushName || 'Unknown';

            // Send processing message
            await sock.sendMessage(from, {
                text: `⏳ *Revealing view once ${mediaType}...*\n\n` +
                    `👤 From: ${senderName}\n` +
                    `📱 Number: +${senderNumber}`
            }, { quoted: msg });

            try {
                // Get the media message
                const mediaMsg = isImage ? viewOnceMsg.imageMessage : viewOnceMsg.videoMessage;

                // Create a proper message structure for downloading
                const messageForDownload = {
                    key: {
                        remoteJid: from,
                        id: contextInfo.stanzaId,
                        participant: sender
                    },
                    message: viewOnceMsg
                };

                // Download the media
                const buffer = await downloadMediaMessage(
                    messageForDownload,
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );

                const sizeKB = (buffer.length / 1024).toFixed(2);
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
                        caption: caption,
                        gifPlayback: mediaMsg.gifPlayback || false
                    });
                }

            } catch (downloadError) {
                throw new Error(`Download failed: ${downloadError.message}`);
            }

        } catch (error) {
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