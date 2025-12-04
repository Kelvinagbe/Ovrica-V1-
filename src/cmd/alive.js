const fs = require('fs');
const path = require('path');
const checkDiskSpace = require('check-disk-space').default;
const os = require('os');

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

            // Get process memory usage
            const memUsage = process.memoryUsage();
            const totalMem = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
            const usedMem = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

            // Get system RAM information
            const totalSystemRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeSystemRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const usedSystemRAM = (totalSystemRAM - freeSystemRAM).toFixed(2);
            const ramUsagePercent = ((usedSystemRAM / totalSystemRAM) * 100).toFixed(1);

            // Get disk space information
            let diskInfo = null;
            try {
                const diskPath = process.platform === 'win32' ? 'C:/' : '/';
                diskInfo = await checkDiskSpace(diskPath);
            } catch (diskError) {
                console.error('Failed to get disk info:', diskError);
            }

            let diskText = '';
            if (diskInfo) {
                const totalDisk = (diskInfo.size / 1024 / 1024 / 1024).toFixed(2);
                const freeDisk = (diskInfo.free / 1024 / 1024 / 1024).toFixed(2);
                const usedDisk = (totalDisk - freeDisk).toFixed(2);
                const diskUsagePercent = ((usedDisk / totalDisk) * 100).toFixed(1);
                
                diskText = `├◆ *Disk:* ${usedDisk}GB / ${totalDisk}GB (${diskUsagePercent}%)\n`;
            }

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

            // Determine RAM status emoji
            let ramEmoji = '';
            if (ramUsagePercent > 80) {
                ramEmoji = '';
            } else if (ramUsagePercent > 60) {
                ramEmoji = '';
            }

            const aliveMessage = 
                `┌ ❏ *⌜ BOT STATUS ⌟* ❏\n` +
                `│\n` +
                `├◆ *Status:* Online\n` +
                `├◆ ${speedEmoji} *Speed:* ${responseTime}ms\n` +
                `├◆ *Performance:* ${speedStatus}\n` +
                `│\n` +
                `└ ❏\n` +
                `┌ ❏ ◆ *⌜ SYSTEM INFO ⌟* ◆\n` +
                `│\n` +
                `├◆ *Uptime:* ${uptimeStr}\n` +
                `├◆ *Bot Memory:* ${usedMem}MB / ${totalMem}MB\n` +
                `├◆ ${ramEmoji} *System RAM:* ${usedSystemRAM}GB / ${totalSystemRAM}GB (${ramUsagePercent}%)\n` +
                diskText +
                `├◆ *Platform:* ${process.platform}\n` +
                `├◆ *Node:* ${process.version}\n` +
                `├◆ *CPU Cores:* ${os.cpus().length}\n` +
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
                    body: `Online • ${responseTime}ms • RAM: ${ramUsagePercent}%`,
                    thumbnail: thumbnailBuffer,
                    sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                    mediaType: 1,
                    renderLargerThumbnail: false
                };
            }

            // Send the alive status
            await sock.sendMessage(from, messageOptions, { quoted: msg });

            console.log(`🤖 Alive status sent to ${from} | RAM: ${ramUsagePercent}% | Disk: ${diskInfo ? (diskInfo.free / 1024 / 1024 / 1024).toFixed(2) + 'GB free' : 'N/A'}`);

        } catch (error) {
            console.error('❌ Alive command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to fetch bot status. Please try again!'
            });
        }
    }
};