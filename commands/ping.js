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

            // Format uptime
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

            const pingMessage = 
                `┌ ❏ *⌜ PING RESPONSE ⌟* ❏\n` +
                `│\n` +
                `├◆ ${speedEmoji} *Response Time:* ${responseTime}ms\n` +
                `├◆ 📊 *Status:* ${speedStatus}\n` +
                `│\n` +
                `└ ❏\n` +
                `┌ ❏ ◆ *⌜SYSTEM INFO⌟* ◆\n` +
                `│\n` +
                `├◆ ⏱️ *Uptime:* ${uptimeStr}\n` +
                `├◆ 💾 *Memory:* ${usedMem}MB / ${totalMem}MB\n` +
                `├◆ 🖥️ *Platform:* ${process.platform}\n` +
                `├◆ 📦 *Node:* ${process.version}\n` +
                `├◆ ✅ *Status:* Online\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 🎭Kelvin🎭`;

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