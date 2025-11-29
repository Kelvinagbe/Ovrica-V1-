// commands/alive.js - Alive command to show full bot status
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'alive',
    admin: false,
    description: 'Check bot status and system information',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            const startTime = Date.now();

            // Get response time
            await sock.sendPresenceUpdate('composing', from);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Get system uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            // Get memory usage
            const memUsage = process.memoryUsage();
            const totalMem = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
            const usedMem = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

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

            const aliveMessage = 
                `┌ ❏ *⌜ BOT STATUS ⌟* ❏\n` +
                `│\n` +
                `├◆ ✅ *Status:* Online\n` +
                `├◆ ${speedEmoji} *Speed:* ${responseTime}ms\n` +
                `├◆ 📊 *Performance:* ${speedStatus}\n` +
                `│\n` +
                `└ ❏\n` +
                `┌ ❏ ◆ *⌜ SYSTEM INFO ⌟* ◆\n` +
                `│\n` +
                `├◆ ⏱️ *Uptime:* ${uptimeStr}\n` +
                `├◆ 💾 *Memory:* ${usedMem}MB / ${totalMem}MB\n` +
                `├◆ 🖥️ *Platform:* ${process.platform}\n` +
                `├◆ 📦 *Node:* ${process.version}\n` +
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
                text: aliveMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄",
                        serverMessageId: 200
                    }
                }
            };

            // Add thumbnail if available
            if (thumbnailBuffer) {
                messageOptions.contextInfo.externalAdReply = {
                    title: "🤖 Bot Status",
                    body: `Online • ${responseTime}ms • ${speedStatus}`,
                    thumbnail: thumbnailBuffer,
                    sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                    mediaType: 1,
                    renderLargerThumbnail: false
                };
            }

            // Send the alive status
            await sock.sendMessage(from, messageOptions, { quoted: msg });

            console.log(`🤖 Alive status sent to ${from}`);

        } catch (error) {
            console.error('❌ Alive command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to fetch bot status. Please try again!'
            });
        }
    }
};