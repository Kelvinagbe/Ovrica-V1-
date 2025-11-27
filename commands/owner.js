// commands/owner.js - Owner command to show bot author info
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'owner',
    admin: false,
    description: 'Display bot owner/author information',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Get owner/author info (customize these)
            const ownerInfo = {
                name: '🎭 Kelvin',
                role: 'Bot Developer',
                github: 'https://github.com/Kelvinagbe',
                whatsapp: '2348109860102', // Owner's WhatsApp number
                channel: 'https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10',
                bio: 'Full Stack Developer & WhatsApp Bot Creator'
            };

            const ownerMessage = 
                `┌ ❏ *⌜ BOT OWNER INFO ⌟* ❏\n` +
                `│\n` +
                `├◆ 👤 *Name:* ${ownerInfo.name}\n` +
                `├◆ 💼 *Role:* ${ownerInfo.role}\n` +
                `├◆ 📝 *Bio:* ${ownerInfo.bio}\n` +
                `│\n` +
                `└ ❏\n` +
                `┌ ❏ ◆ *⌜CONTACT INFO⌟* ◆\n` +
                `│\n` +
                `├◆ 📱 *WhatsApp:* wa.me/${ownerInfo.whatsapp}\n` +
                `├◆ 💻 *GitHub:* ${ownerInfo.github}\n` +
                `├◆ 📢 *Channel:* ${ownerInfo.channel}\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by ${ownerInfo.name}`;

            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let imageBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                imageBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            // Send owner info with image if available
            if (imageBuffer) {
                await sock.sendMessage(from, {
                    image: imageBuffer,
                    caption: ownerMessage,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        }
                    }
                }, { quoted: msg });
            } else {
                // Fallback to text only if image not found
                await sock.sendMessage(from, {
                    text: ownerMessage,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        }
                    }
                }, { quoted: msg });
            }

            console.log(`👤 Owner info sent to ${from}`);

        } catch (error) {
            console.error('❌ Owner command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to retrieve owner information. Please try again!'
            });
        }
    }
};