// commands/menu.js - Working buttons using proper Baileys methods

const fs = require('fs');
const path = require('path');
const { generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'menu',
    admin: false,
    description: 'Show main menu with buttons',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            // Menu text
            const menuText = `╭━━━━『 🤖 BOT MENU 』━━━━╮
│
│ *Bot Name:* 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏
│ *Owner:* KELVIN AGBE
│ *Version:* 1.0.0
│ *Prefix:* /
│ *Mode:* Public
│ *Commands:* 2550+
│
╰━━━━━━━━━━━━━━━━━━━━╯

Select a category below:`;

            // Image path
            const imagePath = path.join(__dirname, '../../assets/app.png');
            
            // Generate image message if exists
            let imageMessage = null;
            if (fs.existsSync(imagePath)) {
                try {
                    imageMessage = (await generateWAMessageContent(
                        { image: fs.readFileSync(imagePath) },
                        { upload: sock.waUploadToServer }
                    )).imageMessage;
                    console.log('✅ Image loaded');
                } catch (imgError) {
                    console.error('⚠️ Image error:', imgError.message);
                }
            }

            // Create a single card (like YTS but just one card)
            const card = {
                header: imageMessage ? {
                    title: '🤖 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏 Menu',
                    hasMediaAttachment: true,
                    imageMessage: imageMessage
                } : {
                    title: '🤖 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏 Menu',
                    hasMediaAttachment: false
                },
                body: { text: menuText },
                footer: { text: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏' },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '👤 Owner Menu',
                                id: '.ownermenu'
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Main Menu',
                                id: '.mainmenu'
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '👥 Group Menu',
                                id: '.groupmenu'
                            })
                        }
                    ]
                }
            };

            // Use carousel format (even with 1 card) - exactly like YTS
            const message = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            body: { text: '📋 Bot Menu' },
                            footer: { text: 'Select a category' },
                            carouselMessage: {
                                cards: [card]
                            }
                        }
                    }
                }
            }, { quoted: msg });

            // Send the message
            const sentMsg = await sock.relayMessage(from, message.message, { messageId: message.key.id });
            
            console.log(`📱 Menu sent to ${from}`);
            console.log(`Message ID: ${message.key.id}`);
            console.log(`Sent status:`, sentMsg ? 'Success' : 'Failed');

        } catch (error) {
            console.error('❌ Button menu failed:', error);
            
            // Fallback to simple text
            await sendWithTyping(sock, from, `╭━━━━『 🤖 BOT MENU 』━━━━╮
│
│ *Bot Name:* 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏
│ *Owner:* KELVIN AGBE
│ *Version:* 1.0.0
│
│ *Quick Commands:*
│ • .ownermenu
│ • .mainmenu
│ • .groupmenu
│
╰━━━━━━━━━━━━━━━━━━━━╯`);
        }
    }
};

// ============================================
// Sub-menu handlers
// ============================================

