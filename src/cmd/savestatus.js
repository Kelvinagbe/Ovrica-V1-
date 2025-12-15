const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'savestatus',
    admin: false,
    description: 'Reply to a status with /savestatus to save it',

    exec: async (sock, from, args, msg, isAdmin) => {
        console.log('🔍 SAVESTATUS COMMAND RECEIVED');

        try {
            const CONFIG = require('@/config');

            // Check if user replied to a message
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;

            if (!quotedMsg || !quotedMsg.quotedMessage) {
                return await sock.sendMessage(from, {
                    text: `❌ Reply to a status to save it\n\n` +
                        `Usage:\n` +
                        `/savestatus - save to admin\n` +
                        `/savestatus me - save to yourself\n` +
                        `/savestatus 2348012345678 - save to number`
                }, { quoted: msg });
            }

            // Determine target
            let targetJid;

            if (args[0]) {
                const input = args[0].toLowerCase();

                if (input === 'me') {
                    targetJid = from;
                } else {
                    const cleanNumber = input.replace(/[^0-9]/g, '');
                    if (cleanNumber.length < 10) {
                        return await sock.sendMessage(from, {
                            text: `❌ Invalid number format`
                        }, { quoted: msg });
                    }
                    targetJid = cleanNumber + '@s.whatsapp.net';
                }
            } else {
                if (!CONFIG.admins || CONFIG.admins.length === 0) {
                    return await sock.sendMessage(from, {
                        text: `❌ No admin configured\n\nUse: /savestatus me`
                    }, { quoted: msg });
                }
                targetJid = CONFIG.admins[0] + '@s.whatsapp.net';
            }

            // Send processing message
            const processingMsg = await sock.sendMessage(from, {
                text: `⏳ Processing...`
            }, { quoted: msg });

            // Determine message type
            const quotedMessage = quotedMsg.quotedMessage;
            let mediaType = null;
            let caption = '';
            let buffer = null;

            const statusOwner = quotedMsg.participant || 'Unknown';

            if (quotedMessage.imageMessage) {
                mediaType = 'image';
                caption = quotedMessage.imageMessage.caption || '';

                buffer = await downloadMediaMessage(
                    { 
                        key: quotedMsg.stanzaId ? {
                            remoteJid: from,
                            fromMe: false,
                            id: quotedMsg.stanzaId,
                            participant: statusOwner
                        } : msg.key,
                        message: { imageMessage: quotedMessage.imageMessage }
                    },
                    'buffer',
                    {}
                );

            } else if (quotedMessage.videoMessage) {
                mediaType = 'video';
                caption = quotedMessage.videoMessage.caption || '';

                buffer = await downloadMediaMessage(
                    {
                        key: quotedMsg.stanzaId ? {
                            remoteJid: from,
                            fromMe: false,
                            id: quotedMsg.stanzaId,
                            participant: statusOwner
                        } : msg.key,
                        message: { videoMessage: quotedMessage.videoMessage }
                    },
                    'buffer',
                    {}
                );

            } else if (quotedMessage.conversation) {
                mediaType = 'text';
                caption = quotedMessage.conversation;

            } else if (quotedMessage.extendedTextMessage) {
                mediaType = 'text';
                caption = quotedMessage.extendedTextMessage.text || '';

            } else {
                throw new Error('Unsupported message type');
            }

            // Send to target
            if (mediaType === 'text') {
                await sock.sendMessage(targetJid, {
                    text: caption
                });

            } else if (mediaType === 'image') {
                await sock.sendMessage(targetJid, {
                    image: buffer,
                    caption: caption || undefined
                });

            } else if (mediaType === 'video') {
                await sock.sendMessage(targetJid, {
                    video: buffer,
                    caption: caption || undefined
                });
            }

            // Update to success
            await sock.sendMessage(from, {
                text: `✅ Status saved`,
                edit: processingMsg.key
            });

            console.log(`💾 Status saved - Type: ${mediaType}`);

        } catch (error) {
            console.error('❌ SaveStatus error:', error);

            await sock.sendMessage(from, {
                text: `❌ Failed to save status\n\nMake sure you replied to a status message`
            }, { quoted: msg });
        }
    }
};