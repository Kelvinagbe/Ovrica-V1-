// commands/ping.js - Ping command to check bot response time
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ping',
    admin: false,
    description: 'Check bot response time and status',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            const startTime = Date.now();

            // Send initial ping message
            const sentMsg = await sock.sendMessage(from, {
                text: '🏓 *Pinging...*'
            }, { quoted: msg });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Get system uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            // Determine speed emoji and status
            let speedEmoji = '🟢';
            let speedStatus = 'Excellent';
            if (responseTime > 1000) {
                speedEmoji = '🔴';
                speedStatus = 'Slow';
            } else if (responseTime > 500) {
                speedEmoji = '🟡';
                speedStatus = 'Good';
            }

            const pingMessage = 
                `┌ ❏ *⌜ SPEED TEST ⌟* ❏\n` +
                `│\n` +
                `├◆ ${speedEmoji} *${responseTime}ms*\n` +
                `├◆ 📊 *${speedStatus}*\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

            // Delete the "Pinging..." message first
            try {
                await sock.sendMessage(from, {
                    delete: sentMsg.key
                });
            } catch (e) {
                console.log('Could not delete ping message');
            }

            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let thumbnailBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            // Prepare message options
            const messageOptions = {
                text: pingMessage,
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

            // Add thumbnail if available
            if (thumbnailBuffer) {
                messageOptions.contextInfo.externalAdReply = {
                    title: "🏓 Ping Status",
                    body: `${responseTime}ms • ${speedStatus}`,
                    thumbnail: thumbnailBuffer,
                    sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                    mediaType: 1,
                    renderLargerThumbnail: false
                };
            }

            // Send the final result
            await sock.sendMessage(from, messageOptions, { quoted: msg });

            console.log(`🏓 Ping: ${responseTime}ms from ${from}`);

        } catch (error) {
            console.error('❌ Ping command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to ping. Please try again!'
            });
        }
    }
};