 // commands/savestatus.js - Save status by replying to it

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'savestatus',
    admin: false, // Anyone can use
    description: 'Reply to a status with /savestatus to save it',

    exec: async (sock, from, args, msg, isAdmin) => {
        console.log('🔍 SAVESTATUS COMMAND RECEIVED');
        
        try {
            const CONFIG = require('../config');

            // Check if user replied to a message
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
            
            if (!quotedMsg || !quotedMsg.quotedMessage) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SAVE STATUS ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 💾 *How to use:*\n` +
                        `├◆ 1️⃣ View someone's status\n` +
                        `├◆ 2️⃣ Reply to the status\n` +
                        `├◆ 3️⃣ Type: /savestatus\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜OPTIONS⌟* ◆\n` +
                        `│\n` +
                        `├◆ 📤 *Save to admin:*\n` +
                        `├◆    Reply to status + /savestatus\n` +
                        `│\n` +
                        `├◆ 📞 *Save to number:*\n` +
                        `├◆    Reply to status + /savestatus 2348012345678\n` +
                        `│\n` +
                        `├◆ 👤 *Save to yourself:*\n` +
                        `├◆    Reply to status + /savestatus me\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜SUPPORTED⌟* ◆\n` +
                        `│\n` +
                        `├◆ 🖼️ Image statuses\n` +
                        `├◆ 🎥 Video statuses\n` +
                        `├◆ 📝 Text statuses\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: "💾 Save Status",
                            body: "Reply to status to save",
                            thumbnailUrl: "https://i.ibb.co/0FksjQz/icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            // Determine target
            let targetJid;
            let targetDisplay;

            if (args[0]) {
                const input = args[0].toLowerCase();
                
                if (input === 'me') {
                    // Save to user themselves
                    targetJid = from;
                    targetDisplay = 'You';
                } else {
                    // Custom number
                    const cleanNumber = input.replace(/[^0-9]/g, '');
                    if (cleanNumber.length < 10) {
                        return await sock.sendMessage(from, {
                            text: `❌ Invalid number format\n\n` +
                                `📝 Use: /savestatus 2348012345678\n` +
                                `Or: /savestatus me`
                        }, { quoted: msg });
                    }
                    targetJid = cleanNumber + '@s.whatsapp.net';
                    targetDisplay = `+${cleanNumber}`;
                }
            } else {
                // Use admin
                if (!CONFIG.admins || CONFIG.admins.length === 0) {
                    return await sock.sendMessage(from, {
                        text: `❌ No admin configured\n\n` +
                            `💡 Options:\n` +
                            `• /savestatus me (save to yourself)\n` +
                            `• /savestatus 2348012345678 (save to number)`
                    }, { quoted: msg });
                }
                targetJid = CONFIG.admins[0] + '@s.whatsapp.net';
                targetDisplay = `Admin (+${CONFIG.admins[0]})`;
            }

            // Send processing message
            const processingMsg = await sock.sendMessage(from, {
                text: `⏳ Processing status...\n📤 Sending to ${targetDisplay}`
            }, { quoted: msg });

            // Get user info
            const userName = msg.pushName || 'User';
            const userNumber = from.split('@')[0];

            // Get status owner from quoted message
            const statusOwner = quotedMsg.participant || 'Unknown';
            const statusOwnerNumber = statusOwner.split('@')[0];

            // Determine message type
            const quotedMessage = quotedMsg.quotedMessage;
            let mediaType = null;
            let caption = '';
            let buffer = null;

            console.log('📱 Quoted message type:', Object.keys(quotedMessage)[0]);

            if (quotedMessage.imageMessage) {
                mediaType = 'image';
                caption = quotedMessage.imageMessage.caption || '';
                
                // Download media
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

            // Build header
            const header =
                `┌ ❏ *⌜ STATUS SAVED ⌟* ❏\n` +
                `│\n` +
                `├◆ 💾 *Saved by:* ${userName}\n` +
                `├◆ 📱 *Saver:* +${userNumber}\n` +
                `├◆ 👤 *Status from:* +${statusOwnerNumber}\n` +
                `├◆ 📅 *Date:* ${new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Lagos' })}\n` +
                `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                `├◆ 📝 *Type:* ${mediaType.toUpperCase()}\n` +
                `│\n` +
                `└ ❏\n\n`;

            // Send to target
            if (mediaType === 'text') {
                await sock.sendMessage(targetJid, {
                    text: header + `*Status Message:*\n${caption}`
                });

            } else if (mediaType === 'image') {
                await sock.sendMessage(targetJid, {
                    image: buffer,
                    caption: header + (caption ? `*Caption:*\n${caption}` : '*No caption*')
                });

            } else if (mediaType === 'video') {
                await sock.sendMessage(targetJid, {
                    video: buffer,
                    caption: header + (caption ? `*Caption:*\n${caption}` : '*No caption*')
                });
            }

            // Update to success
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ SUCCESS ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ✅ *Status saved successfully*\n` +
                    `├◆ 📤 *Sent to:* ${targetDisplay}\n` +
                    `├◆ 👤 *From:* +${statusOwnerNumber}\n` +
                    `├◆ 📝 *Type:* ${mediaType.toUpperCase()}\n` +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true })}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`,
                edit: processingMsg.key
            });

            console.log(`💾 Status saved by ${userName} to ${targetDisplay} - Type: ${mediaType}`);

        } catch (error) {
            console.error('❌ SaveStatus error:', error);
            console.error('Error stack:', error.stack);

            let errorMsg = error.message;
            let errorSolution = 'Try again';

            if (error.message.includes('download')) {
                errorMsg = 'Failed to download media';
                errorSolution = 'Media might be expired or deleted';
            } else if (error.message.includes('Unsupported')) {
                errorMsg = 'Message type not supported';
                errorSolution = 'Only image, video, and text supported';
            } else if (error.message.includes('404')) {
                errorMsg = 'Target not found';
                errorSolution = 'Check the phone number';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to save status*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `├◆ 🔧 *Tips:*\n` +
                    `├◆    • Make sure you replied to a status\n` +
                    `├◆    • Status might be expired (24hrs)\n` +
                    `├◆    • Try viewing the status again\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};