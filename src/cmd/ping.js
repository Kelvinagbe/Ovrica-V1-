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

            // Get memory usage
            const memUsage = process.memoryUsage();
            const memUsageMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

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
                `├◆ 💾 *Memory: ${memUsageMB} MB*\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

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
                edit: sentMsg.key,
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

            // Edit the message with final result
            await sock.sendMessage(from, messageOptions);

            console.log(`🏓 Ping: ${responseTime}ms from ${from}`);

        } catch (error) {
            console.error('❌ Ping command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to ping. Please try again!'
            });
        }
    }
};