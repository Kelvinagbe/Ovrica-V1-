const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'menu',
    admin: false,
    description: 'Show main menu with buttons',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            // Simple menu text
            const menuText = `╭━━━━『 🤖 BOT MENU 』━━━━╮
│
│ *Bot Name:* 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏
│ *Owner:* KELVIN AGBE
│ *Version:* 1.0.0
│ *Prefix:* /
│ *Mode:* Public
│
╰━━━━━━━━━━━━━━━━━━━━╯

Select a menu category below:`;

            // Create buttons
            const buttons = [
                {
                    buttonId: 'ownermenu',
                    buttonText: { displayText: '👤 Owner Menu' },
                    type: 1
                },
                {
                    buttonId: 'mainmenu',
                    buttonText: { displayText: '📋 Main Menu' },
                    type: 1
                },
                {
                    buttonId: 'groupmenu',
                    buttonText: { displayText: '👥 Group Menu' },
                    type: 1
                }
            ];

            // Image path
            const imagePath = path.join(__dirname, '../../assets/app.png');
            
            // Send message with buttons
            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(from, {
                    image: fs.readFileSync(imagePath),
                    caption: menuText,
                    footer: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                    buttons: buttons,
                    headerType: 4
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    text: menuText,
                    footer: '© 2024 𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏',
                    buttons: buttons,
                    headerType: 1
                }, { quoted: msg });
            }

            console.log(`📱 Menu sent to ${from}`);

        } catch (error) {
            console.error('❌ Menu error:', error);
            await sendWithTyping(sock, from, '❌ Failed to load menu!');
        }
    }
};