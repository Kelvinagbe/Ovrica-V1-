// commands/savestatus.js - Save WhatsApp status to admin, custom number, or group

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'savestatus',
    admin: false, // Anyone can use this
    description: 'Save replied status to admin DM, custom number, or group',
    
    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Get admin JID from config
            const CONFIG = require('../config');
            const adminNumbers = CONFIG.admins || [];
            
            // Determine target JID and type
            let targetJid;
            let targetDisplay;
            let targetType = 'admin'; // 'admin', 'custom', or 'group'
            
            if (args[0]) {
                const input = args[0].toLowerCase();
                
                if (input === 'group' || input === 'gc') {
                    // Send to current group
                    if (!from.endsWith('@g.us')) {
                        return await sock.sendMessage(from, {
                            text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                                `│\n` +
                                `├◆ ❌ *Not in a group*\n` +
                                `├◆ 📝 *This command only works in groups*\n` +
                                `├◆ 💡 *Use:* /savestatus group (in a group chat)\n` +
                                `│\n` +
                                `└ ❏\n` +
                                `> Powered by 🎭Kelvin🎭`
                        }, { quoted: msg });
                    }
                    
                    targetJid = from;
                    targetDisplay = 'This Group';
                    targetType = 'group';
                } else {
                    // Custom number provided
                    const customNumber = input.replace(/[^0-9]/g, '');
                    
                    if (customNumber.length < 10) {
                        return await sock.sendMessage(from, {
                            text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                                `│\n` +
                                `├◆ ❌ *Invalid input*\n` +
                                `├◆ 📝 *Format:*\n` +
                                `├◆    • /savestatus 234XXXXXXXXXX\n` +
                                `├◆    • /savestatus group\n` +
                                `│\n` +
                                `└ ❏\n` +
                                `> Powered by 🎭Kelvin🎭`
                        }, { quoted: msg });
                    }
                    
                    targetJid = customNumber + '@s.whatsapp.net';
                    targetDisplay = `+${customNumber}`;
                    targetType = 'custom';
                }
            } else {
                // Use admin
                if (adminNumbers.length === 0) {
                    return await sock.sendMessage(from, {
                        text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                            `│\n` +
                            `├◆ ❌ *No admin configured*\n` +
                            `├◆ 📝 *Options:*\n` +
                            `├◆    • /savestatus 234XXXXXXXXXX\n` +
                            `├◆    • /savestatus group (in groups)\n` +
                            `│\n` +
                            `└ ❏\n` +
                            `> Powered by 🎭Kelvin🎭`
                    }, { quoted: msg });
                }
                
                targetJid = adminNumbers[0] + '@s.whatsapp.net';
                targetDisplay = 'Admin';
                targetType = 'admin';
            }

            // Check if command is used as reply
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quotedMsg) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SAVE STATUS ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 💾 *Save WhatsApp Status*\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜USAGE⌟* ◆\n` +
                        `│\n` +
                        `├◆ 📝 *To Admin:*\n` +
                        `├◆    Reply to status: /savestatus\n` +
                        `│\n` +
                        `├◆ 📞 *To Custom Number:*\n` +
                        `├◆    /savestatus 234XXXXXXXXXX\n` +
                        `├◆    Example: /savestatus 2348012345678\n` +
                        `│\n` +
                        `├◆ 👥 *To Group:*\n` +
                        `├◆    /savestatus group\n` +
                        `├◆    (Works only in group chats)\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜SUPPORTED⌟* ◆\n` +
                        `│\n` +
                        `├◆ 🖼️ Images\n` +
                        `├◆ 🎥 Videos\n` +
                        `├◆ 📝 Text status\n` +
                        `├◆ 👥 Group mentions in status\n` +
                        `├◆ 📎 Status replies\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "💾 Save Status",
                            body: "Forward status anywhere",
                            thumbnailUrl: "./icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            // Send processing message
            const processingMsg = await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ PROCESSING ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ⏳ *Saving status...*\n` +
                    `├◆ 📤 *Sending to ${targetDisplay}*\n` +
                    `│\n` +
                    `└ ❏`
            }, { quoted: msg });

            // Get user info
            const userName = msg.pushName || 'User';
            const userNumber = from.split('@')[0];

            // Determine message type and extract content
            let mediaType = null;
            let caption = '';
            let buffer = null;

            // Handle different message types including group mentions
            if (quotedMsg.imageMessage) {
                mediaType = 'image';
                caption = quotedMsg.imageMessage.caption || '';
                buffer = await downloadMediaMessage(
                    { message: quotedMsg },
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
            } else if (quotedMsg.videoMessage) {
                mediaType = 'video';
                caption = quotedMsg.videoMessage.caption || '';
                buffer = await downloadMediaMessage(
                    { message: quotedMsg },
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
            } else if (quotedMsg.conversation) {
                mediaType = 'text';
                caption = quotedMsg.conversation;
            } else if (quotedMsg.extendedTextMessage) {
                mediaType = 'text';
                caption = quotedMsg.extendedTextMessage.text || '';
                
                // Check for group mentions
                const groupMentions = quotedMsg.extendedTextMessage.contextInfo?.groupMentions;
                if (groupMentions && groupMentions.length > 0) {
                    caption += '\n\n👥 *Group Mentions:*\n';
                    groupMentions.forEach(mention => {
                        caption += `• ${mention.groupSubject || 'Group'}\n`;
                    });
                }
            } else {
                throw new Error('Unsupported status type');
            }

            // Extract mentions if any
            const mentions = quotedMsg.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let mentionText = '';
            if (mentions.length > 0) {
                mentionText = `\n├◆ 👤 *Mentions:* ${mentions.length} user(s)`;
            }

            // Get status owner info if available
            const statusOwner = msg.message?.extendedTextMessage?.contextInfo?.participant || 'Unknown';
            const statusOwnerNumber = statusOwner.split('@')[0];

            // Build header message
            const messageHeader = 
                `┌ ❏ *⌜ STATUS SAVED ⌟* ❏\n` +
                `│\n` +
                `├◆ 📤 *Saved by:* ${userName}\n` +
                `├◆ 📱 *Saver Number:* +${userNumber}\n` +
                `├◆ 👤 *Status Owner:* +${statusOwnerNumber}\n` +
                `├◆ 📅 *Date:* ${new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Lagos' })}\n` +
                `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                `├◆ 📝 *Type:* ${mediaType.toUpperCase()}\n` +
                mentionText +
                `│\n` +
                `└ ❏\n\n`;

            // Send to target based on type
            if (mediaType === 'text') {
                // Text status
                await sock.sendMessage(targetJid, {
                    text: messageHeader + `*Status Message:*\n${caption}`,
                    mentions: mentions.length > 0 ? mentions : undefined
                });

            } else if (mediaType === 'image' || mediaType === 'video') {
                // Media status
                const messageContent = {
                    caption: messageHeader + (caption ? `*Caption:*\n${caption}` : '*No caption*'),
                    mentions: mentions.length > 0 ? mentions : undefined
                };

                if (mediaType === 'image') {
                    messageContent.image = buffer;
                } else if (mediaType === 'video') {
                    messageContent.video = buffer;
                }

                await sock.sendMessage(targetJid, messageContent);
            }

            // Build success message based on target type
            let successEmoji = '📤';
            if (targetType === 'group') {
                successEmoji = '👥';
            } else if (targetType === 'custom') {
                successEmoji = '📞';
            }

            // Update processing message to success
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ SUCCESS ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ✅ *Status saved successfully*\n` +
                    `├◆ ${successEmoji} *Sent to:* ${targetDisplay}\n` +
                    `├◆ 📝 *Type:* ${mediaType.toUpperCase()}\n` +
                    (mentions.length > 0 ? `├◆ 👤 *Mentions:* ${mentions.length} user(s)\n` : '') +
                    `├◆ 👤 *Status Owner:* +${statusOwnerNumber}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`,
                edit: processingMsg.key
            }, { quoted: msg });

            console.log(`💾 Status saved by ${userName} (${userNumber}) to ${targetDisplay} (${targetType}) - Type: ${mediaType}`);

        } catch (error) {
            console.error('❌ Save status error:', error);
            
            let errorMsg = error.message;
            let errorSolution = 'Try again';
            
            if (error.message.includes('download')) {
                errorMsg = 'Failed to download media';
                errorSolution = 'Status might be expired or deleted';
            } else if (error.message.includes('Unsupported')) {
                errorMsg = 'Status type not supported';
                errorSolution = 'Try with image, video or text status';
            } else if (error.message.includes('404')) {
                errorMsg = 'Target not found';
                errorSolution = 'Check the phone number or group';
            } else if (error.message.includes('403')) {
                errorMsg = 'Permission denied';
                errorSolution = 'Bot might not be in the target group';
            }
            
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to save status*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `├◆ 🔧 *Common issues:*\n` +
                    `├◆    • Reply to actual status\n` +
                    `├◆    • Status might be expired\n` +
                    `├◆    • Media download failed\n` +
                    `├◆    • Invalid target\n` +
                    `├◆    • Bot not in target group\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};