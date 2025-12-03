// commands/ban.js

const { templates } = require('../tmp/templates');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'ban',
    admin: true,
    description: 'Remove a member from the group',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            const text = templates.error('This command can only be used in groups!');
            return await sendWithTyping(sock, from, { text });
        }

        // Get mentioned user or quoted message
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const targetJid = mentionedJid || quotedParticipant;

        if (!targetJid) {
            const text = templates.error('Please mention or reply to the user you want to ban!\n\nUsage: /ban @user');
            return await sendWithTyping(sock, from, { text });
        }

        try {
            // Remove participant from group
            await sock.groupParticipantsUpdate(from, [targetJid], 'remove');

            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let thumbnailBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            const banMessage = `✅ User has been removed from the group!\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

            // Prepare message options
            const messageOptions = {
                text: banMessage,
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
            console.error('Ban error:', error);
            const text = templates.error(`Failed to ban user: ${error.message}`);
            await sendWithTyping(sock, from, { text });
        }
    }
};