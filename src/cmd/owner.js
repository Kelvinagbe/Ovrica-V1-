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
                name: '𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄',
                github: 'https://github.com/Kelvinagbe',
                whatsapp: '2348109860102', // Owner's WhatsApp number
                channel: 'https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10'
            };

            const ownerMessage = 
                `┌ ❏ *⌜ BOT OWNER ⌟* ❏\n` +
                `│\n` +
                `├◆ 👤 *${ownerInfo.name}*\n` +
                `│\n` +
                `├◆ 📱 *Number:* wa.me/${ownerInfo.whatsapp}\n` +
                `├◆ 💻 *GitHub:* ${ownerInfo.github}\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by ${ownerInfo.name}`;

            let imageBuffer = null;

            // Try to get owner's WhatsApp profile picture
            try {
                const ownerJid = `${ownerInfo.whatsapp}@s.whatsapp.net`;
                const profilePicUrl = await sock.profilePictureUrl(ownerJid, 'image');
                
                if (profilePicUrl) {
                    console.log('✅ Fetching owner profile picture...');
                    
                    // Download the profile picture
                    const axios = require('axios');
                    const response = await axios.get(profilePicUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 10000 
                    });
                    imageBuffer = Buffer.from(response.data);
                    
                    console.log('✅ Owner profile picture loaded');
                }
            } catch (profileError) {
                console.log('⚠️ Could not fetch owner profile picture, trying local fallback...');
                
                // Fallback to local thumbnail
                const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
                if (fs.existsSync(thumbnailPath)) {
                    imageBuffer = fs.readFileSync(thumbnailPath);
                    console.log('✅ Using local thumbnail');
                } else {
                    console.log('⚠️ No profile picture or local thumbnail available');
                }
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
                // Fallback to text only if no image available
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