// commands/setname.js

const { templates } = require('../tmp/templates');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'setname',
    admin: true,
    description: 'Change the group name',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            const text = templates.error('This command can only be used in groups!');
            return await sendWithTyping(sock, from, { text });
        }

        if (args.length === 0) {
            const text = templates.error('Usage: /setname <new group name>\n\nExample: /setname Awesome Group');
            return await sendWithTyping(sock, from, { text });
        }

        try {
            const newName = args.join(' ');
            
            // Update group subject (name)
            await sock.groupUpdateSubject(from, newName);

            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let thumbnailBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            const setnameMessage = `✅ Group name has been changed to:\n"${newName}"\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

            // Prepare message options
            const messageOptions = {
                text: setnameMessage,
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
            console.error('Setname error:', error);
            const text = templates.error(`Failed to change group name: ${error.message}`);
            await sendWithTyping(sock, from, { text });
        }
    }
};