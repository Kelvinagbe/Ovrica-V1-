const { templates } = require('@/src/tmp/templates');
const fs = require('fs');
const path = require('path');

function getBotInfo(config) {
    return {
        name: '𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
        owner: 'KELVIN AGBE',
        prefix: '/',
        user: 'User',
        plan: 'Free User',
        version: '1.0.0',
        timezone: 'Africa/Lagos',
        commandCount: '2550',
        platform: 'LINUX',
        runtime: process.version,
        cpu: 'Intel(R) Xeon(R) CPU E5-1620 v2 @ 3.70GHz',
        totalRam: '32050MB',
        mode: config.botMode || 'Public',
        mood: '🌙'
    };
}

module.exports = {
    name: 'menu',
    admin: false,
    description: 'Show main menu with interactive buttons',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const CONFIG = require('@/config');
            const botInfo = getBotInfo(CONFIG);
            
            // Create the menu text
            const menuText = templates.menu(botInfo);
            
            // Define buttons for the menu
            const buttons = [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "👤 Owner Menu",
                        id: ".ownermenu"
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📋 Main Menu",
                        id: ".mainmenu"
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "👥 Group Menu",
                        id: ".groupmenu"
                    })
                }
            ];

            // Prepare context info for fancy reply
            const contextInfo = {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363418958316196@newsletter",
                    newsletterName: "𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏",
                    serverMessageId: 200
                }
            };

            // Path to image
            const imagePath = path.join(__dirname, '../../assets/app.png');
            
            // Check if image exists
            let imageBuffer = null;
            if (fs.existsSync(imagePath)) {
                imageBuffer = fs.readFileSync(imagePath);
            }

            // Send interactive message with buttons
            const interactiveMessage = {
                body: { text: menuText },
                footer: { text: "© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏 | Powered by Keith API" },
                header: imageBuffer ? {
                    title: "🤖 Bot Menu",
                    hasMediaAttachment: true,
                    imageMessage: await sock.generateWAMessageContent(
                        { image: imageBuffer },
                        { upload: sock.waUploadToServer }
                    ).then(img => img.imageMessage)
                } : {
                    title: "🤖 Bot Menu",
                    hasMediaAttachment: false
                },
                nativeFlowMessage: {
                    buttons: buttons,
                    messageParamsJson: ""
                }
            };

            // Send the message
            await sock.sendMessage(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMessage,
                        contextInfo: contextInfo
                    }
                }
            }, { quoted: msg });

            console.log(`📱 Interactive menu sent to ${from}`);

        } catch (error) {
            console.error('❌ Menu command error:', error);
            
            // Fallback to simple text message if interactive fails
            try {
                const CONFIG = require('@/config');
                const text = templates.menu(getBotInfo(CONFIG));
                const imagePath = path.join(__dirname, '../../assets/app.png');
                
                const contextInfo = {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏",
                        serverMessageId: 200
                    }
                };

                if (fs.existsSync(imagePath)) {
                    await sock.sendMessage(from, {
                        image: fs.readFileSync(imagePath),
                        caption: text + "\n\n*Quick Commands:*\n• .ownermenu - Owner commands\n• .mainmenu - Main commands\n• .groupmenu - Group commands",
                        contextInfo: contextInfo
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        text: text + "\n\n*Quick Commands:*\n• .ownermenu - Owner commands\n• .mainmenu - Main commands\n• .groupmenu - Group commands",
                        contextInfo: contextInfo
                    }, { quoted: msg });
                }
            } catch (fallbackError) {
                console.error('❌ Fallback failed:', fallbackError);
                await sendWithTyping(sock, from, '❌ Failed to load menu. Please try again!');
            }
        }
    }
};