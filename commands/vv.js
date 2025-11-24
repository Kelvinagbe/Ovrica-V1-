// commands/vv.js - View Once Media Revealer (No server storage)

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
                        `├◆ 👀 *Reveal View Once Media*\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n` +
                        `│\n` +
                        `├◆ 1️⃣ Someone sends view once photo/video\n` +
                        `├◆ 2️⃣ DON'T open it yet!\n` +
                        `├◆ 3️⃣ Reply to it: /vv\n` +
                        `├◆ 4️⃣ Bot reveals it instantly!\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜SUPPORTED⌟* ◆\n` +
                        `│\n` +
                        `├◆ ✅ View once photos\n` +
                        `├◆ ✅ View once videos\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜NOTE⌟* ◆\n` +
                        `│\n` +
                        `├◆ ⚠️ Don't open before using /vv\n` +
                        `├◆ ⚠️ Once opened, can't be revealed\n` +
                        `├◆ ⚠️ Reply to the view once message\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: "👀 View Once Revealer",
                            body: "Reveal view once instantly",
                            thumbnailUrl: "https://i.ibb.co/0FksjQz/icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            // Check if quoted message is a view once message
            const viewOnceMsg = quotedMsg.viewOnceMessageV2?.message || 
                               quotedMsg.viewOnceMessageV2Extension?.message ||
                               quotedMsg.viewOnceMessage?.message;

            console.log('📱 Message keys:', Object.keys(quotedMsg));

            if (!viewOnceMsg) {
                return await sock.sendMessage(from, {
                    text: `❌ *Not a view once message!*\n\n` +
                        `📝 Make sure you:\n` +
                        `• Reply to view once photo/video\n` +
                        `• Haven't opened it yet\n` +
                        `• Use reply feature properly`
                }, { quoted: msg });
            }

            // Check content type (only images and videos)
            const isImage = !!viewOnceMsg.imageMessage;
            const isVideo = !!viewOnceMsg.videoMessage;

            console.log('🔍 Type - Image:', isImage, 'Video:', isVideo);

            if (!isImage && !isVideo) {
                return await sock.sendMessage(from, {
                    text: `❌ *Invalid view once content!*\n\n` +
                        `✅ Supported: Photos & Videos only\n` +
                        `❌ Not supported: Audio, documents, etc.`
                }, { quoted: msg });
            }

            const mediaType = isImage ? 'image' : 'video';
            const sender = msg.message.extendedTextMessage.contextInfo.participant || from;
            const senderNumber = sender.split('@')[0];
            const senderName = msg.pushName || 'Unknown';

            // Send processing message
            const processingMsg = await sock.sendMessage(from, {
                text: `⏳ Revealing view once ${mediaType}...\n👤 From: ${senderName}`
            }, { quoted: msg });

            console.log(`👀 Revealing ${mediaType} from ${senderName}`);

            try {
                // Download the media to memory (not saved to disk)
                const mediaMsg = isImage ? viewOnceMsg.imageMessage : viewOnceMsg.videoMessage;
                
                const buffer = await downloadMediaMessage(
                    { 
                        key: msg.message.extendedTextMessage.contextInfo.stanzaId ? {
                            remoteJid: from,
                            fromMe: false,
                            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: sender
                        } : msg.key,
                        message: { 
                            [mediaType + 'Message']: mediaMsg 
                        }
                    },
                    'buffer',
                    {}
                );

                console.log(`✅ Downloaded ${(buffer.length / 1024).toFixed(2)} KB`);

                // Get caption if exists
                const originalCaption = mediaMsg.caption || '';

                // Build caption
                const caption = 
                    `┌ ❏ *⌜ VIEW ONCE REVEALED ⌟* ❏\n` +
                    `│\n` +
                    `├◆ 👀 *Content Revealed!*\n` +
                    `├◆ 📝 *Type:* ${mediaType.toUpperCase()}\n` +
                    `├◆ 👤 *From:* ${senderName}\n` +
                    `├◆ 📱 *Number:* +${senderNumber}\n` +
                    `├◆ 📦 *Size:* ${(buffer.length / 1024).toFixed(2)} KB\n` +
                    (originalCaption ? `├◆ 💬 *Caption:* ${originalCaption}\n` : '') +
                    `├◆ 📅 *Date:* ${new Date().toLocaleDateString()}\n` +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true })}\n` +
                    `│\n` +
                    `├◆ ✅ Here's what they sent!\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                // Send the revealed media directly (no saving to server)
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
                    text: `✅ View once ${mediaType} revealed!`,
                    edit: processingMsg.key
                });

                console.log(`✅ View once revealed (not saved to server)`);

            } catch (downloadError) {
                console.error('❌ Download error:', downloadError);
                throw new Error(`Download failed: ${downloadError.message}`);
            }

        } catch (error) {
            console.error('❌ View once error:', error);

            let errorMsg = error.message;
            let errorSolution = 'Try again';

            if (error.message.includes('download') || error.message.includes('404')) {
                errorMsg = 'Failed to download';
                errorSolution = 'Already opened or expired';
            } else if (error.message.includes('decode')) {
                errorMsg = 'Cannot decode media';
                errorSolution = 'Corrupted or unsupported format';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to reveal*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `├◆ 🔧 *Common reasons:*\n` +
                    `├◆    • Already opened\n` +
                    `├◆    • Message expired\n` +
                    `├◆    • Not view once message\n` +
                    `├◆    • Network error\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};