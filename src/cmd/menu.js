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
            
            const card = {
                header: {
                    title: '𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                    hasMediaAttachment: true,
                    imageMessage: (await generateWAMessageContent({ 
                        image: fs.readFileSync(imagePath) 
                    }, {
                        upload: sock.waUploadToServer
                    })).imageMessage
                },
                body: {
                    text: menuText
                },
                footer: { text: "© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏" },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "👤 Owner Menu",
                                copy_code: "/ownermenu"
                            })
                        },
                        {
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "📋 Main Menu",
                                copy_code: "/mainmenu"
                            })
                        },
                        {
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "👥 Group Menu",
                                copy_code: "/groupmenu"
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
                            body: { text: `🤖 ${menuText.split('\n')[0]}` },
                            footer: { text: `Select a menu option` },
                            carouselMessage: { cards: [card] }
                        }
                    }
                }
            }, { quoted: msg });

            await sock.relayMessage(from, message.message, { messageId: message.key.id });

        } catch (error) {
            console.error('❌ Menu error:', error);
        }
    }
};
