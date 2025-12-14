const fs = require('fs');
const path = require('path');

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
            
            // Native flow buttons
            const buttons = [
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
            ];

            // Try sending with buttons
            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(from, {
                    image: fs.readFileSync(imagePath),
                    caption: menuText,
                    footer: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                    interactive: buttons
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    text: menuText,
                    footer: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                    interactive: buttons
                }, { quoted: msg });
            }

            console.log(`📱 Menu with buttons sent to ${from}`);

        } catch (error) {
            console.error('❌ Button menu failed:', error);
            
            // Fallback: Try alternative button format
            try {
                const imagePath = path.join(__dirname, '../../assets/app.png');
                const menuText = `╭━━━━『 🤖 BOT MENU 』━━━━╮
│
│ *Bot Name:* 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏
│ *Owner:* KELVIN AGBE
│ *Version:* 1.0.0
│
╰━━━━━━━━━━━━━━━━━━━━╯

Select a category:`;

                // Alternative format with buttons array
                const altButtons = [
                    { buttonId: '.ownermenu', buttonText: { displayText: '👤 Owner Menu' }, type: 1 },
                    { buttonId: '.mainmenu', buttonText: { displayText: '📋 Main Menu' }, type: 1 },
                    { buttonId: '.groupmenu', buttonText: { displayText: '👥 Group Menu' }, type: 1 }
                ];

                if (fs.existsSync(imagePath)) {
                    await sock.sendMessage(from, {
                        image: fs.readFileSync(imagePath),
                        caption: menuText,
                        footer: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                        buttons: altButtons,
                        headerType: 4
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        text: menuText,
                        footer: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                        buttons: altButtons,
                        headerType: 1
                    }, { quoted: msg });
                }

                console.log(`📱 Fallback buttons sent to ${from}`);
            } catch (fallbackError) {
                console.error('❌ All button formats failed:', fallbackError);
                
                // Final fallback: Simple text with commands
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
    }
};

