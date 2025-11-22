// ============================================
// FILE: utils/bot-notifications.js
// ============================================
const { getUserStats } = require('./session-manager');
async function sendConnectionNotification(sock, adminNumbers, CONFIG) {
try {
if (!adminNumbers || adminNumbers.length === 0) {
console.log('⚠️  No admin configured');
return;
}
const stats = getUserStats();
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const message = 
        `┌ ❏ *⌜ BOT CONNECTED ⌟* ❏\n` +
        `│\n` +
        `├◆ ✅ *Status:* Online\n` +
        `├◆ 🤖 *Bot:* ${CONFIG.botName || 'OVRICA Bot'}\n` +
        `├◆ 📦 *Version:* ${CONFIG.version || '1.0.0'}\n` +
        `├◆ 🔒 *Mode:* ${CONFIG.botMode?.toUpperCase() || 'PUBLIC'}\n` +
        `│\n` +
        `└ ❏\n` +
        `┌ ❏ ◆ *⌜STATISTICS⌟* ◆\n` +
        `│\n` +
        `├◆ 👥 *Users:* ${stats.total}\n` +
        `├◆ 💬 *Chats:* ${stats.privateChats}\n` +
        `├◆ 👥 *Groups:* ${stats.groups}\n` +
        `├◆ 📨 *Messages:* ${stats.totalMessages}\n` +
        `│\n` +
        `└ ❏\n` +
        `┌ ❏ ◆ *⌜SYSTEM⌟* ◆\n` +
        `│\n` +
        `├◆ ⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s\n` +
        `├◆ 🖥️ *Platform:* ${process.platform}\n` +
        `├◆ 📦 *Node:* ${process.version}\n` +
        `├◆ 💾 *Memory:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\n` +
        `│\n` +
        `└ ❏\n` +
        `> Ready at ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}\n` +
        `> Powered by 🎭Kelvin🎭`;

    for (const adminNumber of adminNumbers) {
        try {
            const adminJid = adminNumber + '@s.whatsapp.net';
            await sock.sendMessage(adminJid, {
                text: message,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "✅ Bot Connected",
                        body: `${CONFIG.botName} is online`,
                        thumbnailUrl: "./icon.jpg",
                        sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            });
            console.log(`📤 Notification sent to +${adminNumber}`);
        } catch (error) {
            console.error(`❌ Failed to notify +${adminNumber}`);
        }
    }
} catch (error) {
    console.error('❌ Notification error:', error.message);
}
}
async function sendDisconnectionNotification(sock, adminNumbers, reason = 'Unknown') {
try {
if (!adminNumbers || adminNumbers.length === 0) return;
const message = 
        `┌ ❏ *⌜ BOT DISCONNECTED ⌟* ❏\n` +
        `│\n` +
        `├◆ ⚠️ *Status:* Offline\n` +
        `├◆ 📝 *Reason:* ${reason}\n` +
        `├◆ 🕐 *Time:* ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}\n` +
        `├◆ 🔄 *Action:* Reconnecting...\n` +
        `│\n` +
        `└ ❏\n` +
        `> Powered by 🎭Kelvin🎭`;

    for (const adminNumber of adminNumbers) {
        try {
            const adminJid = adminNumber + '@s.whatsapp.net';
            await sock.sendMessage(adminJid, { text: message });
        } catch (error) {
            // Ignore
        }
    }
} catch (error) {
    // Ignore
}
}
module.exports = {
sendConnectionNotification,
sendDisconnectionNotification
};