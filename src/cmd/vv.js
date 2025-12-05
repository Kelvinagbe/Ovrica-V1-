const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'vv',
    admin: false,
    description: 'Reveal view once images and videos',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Extract quoted message with multiple fallbacks
            let quotedNode = null;
            
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                quotedNode = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            } else if (msg.quoted) {
                quotedNode = msg.quoted;
            }

            if (!quotedNode) {
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

            // Find view-once wrapper (check all possible formats)
            let viewOnceWrapper =
                quotedNode.viewOnceMessage ||
                quotedNode.viewOnceMessageV2 ||
                quotedNode.viewOnceMessageV2Extension ||
                (quotedNode.message && (
                    quotedNode.message.viewOnceMessage ||
                    quotedNode.message.viewOnceMessageV2 ||
                    quotedNode.message.viewOnceMessageV2Extension
                )) ||
                null;

            // Extract inner payload
            let innerPayload = null;
            if (viewOnceWrapper) {
                innerPayload = viewOnceWrapper.message || viewOnceWrapper;
            } else {
                innerPayload = quotedNode.message || quotedNode;
            }

            // Find the actual media node
            const innerNode =
                innerPayload.imageMessage ||
                innerPayload.videoMessage ||
                innerPayload.audioMessage ||
                null;

            if (!innerNode) {
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

            // Determine media type
            let mediaType = null;
            if (innerPayload.imageMessage || innerNode?.mimetype?.startsWith?.("image")) {
                mediaType = "image";
            } else if (innerPayload.videoMessage || innerNode?.mimetype?.startsWith?.("video")) {
                mediaType = "video";
            } else if (innerPayload.audioMessage || innerNode?.mimetype?.startsWith?.("audio")) {
                mediaType = "audio";
            }

            if (!mediaType) {
                return await sock.sendMessage(from, {
                    text: `❌ *Unsupported view once type!*\n\n` +
                        `✅ Supported:\n` +
                        `• View once photos\n` +
                        `• View once videos\n\n` +
                        `❌ Not supported:\n` +
                        `• Other media types`
                }, { quoted: msg });
            }

            // Get sender info
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

            // Download media using streams (more reliable)
            let buffer = null;
            
            try {
                const stream = await downloadContentFromMessage(innerNode, mediaType);
                let tmp = Buffer.from([]);
                for await (const chunk of stream) {
                    tmp = Buffer.concat([tmp, chunk]);
                }
                buffer = tmp;
            } catch (err) {
                console.error("Download error:", err);
                throw new Error("Failed to download media");
            }

            if (!buffer || buffer.length === 0) {
                throw new Error("Downloaded media is empty");
            }

            const sizeKB = (buffer.length / 1024).toFixed(2);
            const originalCaption = innerNode.caption || '';

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
            } else if (mediaType === 'video') {
                await sock.sendMessage(from, {
                    video: buffer,
                    caption: caption,
                    gifPlayback: innerNode.gifPlayback || false
                });
            } else if (mediaType === 'audio') {
                await sock.sendMessage(from, {
                    audio: buffer,
                    mimetype: innerNode.mimetype || "audio/mp4",
                    ptt: innerNode.ptt || false
                });
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