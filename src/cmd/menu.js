const fs = require('fs');
const path = require('path');
const { generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'menu',
    admin: false,
    description: 'Show main menu with buttons',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const menuText = `╔══[❏⧉ */ BOT MENU* ⧉❏]
║
║➲ *Bot Name:* 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏
║➲ *Owner:* KELVIN AGBE
║➲ *Version:* 1.0.0
║➲ *Prefix:* /
║➲ *Mode:* Public
║➲ *Commands:* 2550+
║
╚══━━━━━━━━━━━━⧉❏]

Select a category below:`;

            const imagePath = path.join(__dirname, '../../assets/app.png');
            let imageMessage = null;

            if (fs.existsSync(imagePath)) {
                imageMessage = (await generateWAMessageContent(
                    { image: fs.readFileSync(imagePath) },
                    { upload: sock.waUploadToServer }
                )).imageMessage;
            }

            const card = {
                header: imageMessage ? {
                    title: '𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                    hasMediaAttachment: true,
                    imageMessage: imageMessage
                } : {
                    title: '𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
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
                                id: '/ownermenu'
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Main Menu',
                                id: '/mainmenu'
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '👥 Group Menu',
                                id: '/groupmenu'
                            })
                        }
                    ]
                }
            };

            const message = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            carouselMessage: {
                                cards: [card]
                            }
                        }
                    }
                }
            }, { quoted: msg });

            await sock.relayMessage(from, message.message, { messageId: message.key.id });
            console.log(`📱 Menu sent to ${from}`);

        } catch (error) {
            console.error('❌ Menu error:', error);
            await sendWithTyping(sock, from, `╔══[❏⧉ */ BOT MENU* ⧉❏]
║
║➲ *Bot Name:* 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏
║➲ *Owner:* KELVIN AGBE
║
║ *Quick Commands:*
║➲ .ownermenu
║➲ .mainmenu
║➲ .groupmenu
║
╚══━━━━━━━━━━━━⧉❏]`);
        }
    }
};
