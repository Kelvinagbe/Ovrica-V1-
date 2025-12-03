// commands/setdesc.js

const { templates } = require('../tmp/templates');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'setdesc',
    admin: true,
    description: 'Change the group description',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            const text = templates.error('This command can only be used in groups!');
            return await sendWithTyping(sock, from, { text });
        }

        if (args.length === 0) {
            const text = templates.error('Usage: /setdesc <new description>\n\nExample: /setdesc Welcome to our awesome group!');
            return await sendWithTyping(sock, from, { text });
        }

        try {
            const newDesc = args.join(' ');
            
            // Update group description
            await sock.groupUpdateDescription(from, newDesc);

            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let thumbnailBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            const setdescMessage = `✅ Group description has been updated!\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

            // Prepare message options
            const messageOptions = {
                text: setdescMessage,
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
            console.error('Setdesc error:', error);
            const text = templates.error(`Failed to update description: ${error.message}`);
            await sendWithTyping(sock, from, { text });
        }
    }
};