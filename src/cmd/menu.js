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
                imageMessage = (await generateWAMessageContent(
                    { image: fs.readFileSync(imagePath) },
                    { upload: sock.waUploadToServer }
                )).imageMessage;
            }

            // Create the interactive message exactly like your YTS code
            const message = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            header: imageMessage ? {
                                title: '🤖 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                                hasMediaAttachment: true,
                                imageMessage: imageMessage
                            } : {
                                title: '🤖 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏'
                            },
                            body: { text: menuText },
                            footer: { text: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏 | Powered by Keith API' },
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
                        }
                    }
                }
            }, { quoted: msg });

            await sock.relayMessage(from, message.message, { messageId: message.key.id });

            console.log(`📱 Menu with buttons sent to ${from}`);

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
