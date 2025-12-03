// commands/revoke.js

const { templates } = require('../tmp/templates');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'revoke',
    admin: true,
    description: 'Revoke group invite link',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            const text = templates.error('This command can only be used in groups!');
            return await sendWithTyping(sock, from, { text });
        }

        try {
            // Revoke the current invite link
            await sock.groupRevokeInvite(from);

            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let thumbnailBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            const revokeMessage = `✅ Group invite link has been revoked!\nOld link is no longer valid.\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

            // Prepare message options
            const messageOptions = {
                text: revokeMessage,
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
            console.error('Revoke error:', error);
            const text = templates.error(`Failed to revoke invite link: ${error.message}`);
            await sendWithTyping(sock, from, { text });
        }
    }
};