// commands/welcome.js

const { templates } = require('../tmp/templates');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'welcome',
    admin: true,
    description: 'Toggle welcome messages for new members',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            const text = templates.error('This command can only be used in groups!');
            return await sendWithTyping(sock, from, { text });
        }

        // You'll need to implement a database or config file to store welcome settings
        // This is a basic structure - you need to add your own storage logic
        
        try {
            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let thumbnailBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            const welcomeMessage = `✅ Welcome messages have been enabled!\nNew members will receive a welcome message.\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

            // Prepare message options
            const messageOptions = {
                text: welcomeMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    }
                }
            };

            await sock.sendMessage(from, messageOptions, { quoted: msg });

        } catch (error) {
            console.error('Welcome error:', error);
            const text = templates.error(`Failed to toggle welcome: ${error.message}`);
            await sendWithTyping(sock, from, { text });
        }
    }
};