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
                    text: `❌ Reply to a view once message to reveal it`
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
                    text: `❌ Not a view once message`
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
                    text: `❌ Unsupported media type`
                }, { quoted: msg });
            }

            // Send processing message
            await sock.sendMessage(from, {
                text: `⏳ Revealing...`
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

            const originalCaption = innerNode.caption || '';

            // Send the revealed media
            if (mediaType === 'image') {
                await sock.sendMessage(from, {
                    image: buffer,
                    caption: originalCaption ? `✅ Revealed\n\n${originalCaption}` : '✅ Revealed'
                });
            } else if (mediaType === 'video') {
                await sock.sendMessage(from, {
                    video: buffer,
                    caption: originalCaption ? `✅ Revealed\n\n${originalCaption}` : '✅ Revealed',
                    gifPlayback: innerNode.gifPlayback || false
                });
            } else if (mediaType === 'audio') {
                await sock.sendMessage(from, {
                    audio: buffer,
                    mimetype: innerNode.mimetype || "audio/mp4",
                    ptt: innerNode.ptt || false
                });
                await sock.sendMessage(from, {
                    text: '✅ Revealed'
                });
            }

        } catch (error) {
            let errorMsg = 'Failed to reveal';

            if (error.message.includes('download') || error.message.includes('404')) {
                errorMsg = 'View once already opened or expired';
            } else if (error.message.includes('400')) {
                errorMsg = 'Invalid view once message';
            } else if (error.message.includes('decrypt')) {
                errorMsg = 'Message already viewed';
            }

            await sock.sendMessage(from, {
                text: `❌ ${errorMsg}`
            }, { quoted: msg });
        }
    }
};