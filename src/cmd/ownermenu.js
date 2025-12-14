const { generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'Owner Menu',
    admin: true,
    description: 'Owner commands',
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const text = `╔══[❏⧉ *👤 OWNER MENU* ⧉❏]
║
║ *Bot Management:*
║➲ .setbio - Set bot bio
║➲ .setname - Change bot name
║➲ .setpp - Change profile pic
║➲ .restart - Restart bot
║➲ .shutdown - Shutdown bot
║
║ *User Management:*
║➲ .block - Block user
║➲ .unblock - Unblock user
║➲ .broadcast - Send to all
║➲ .clearall - Clear all chats
║
║ *System:*
║➲ .update - Update bot
║➲ .eval - Run code
║➲ .exec - Execute command
║
╚══━━━━━━━━━━━━⧉❏]`;
        
        // Send with contextInfo
        await sock.sendMessage(from, {
            text: text,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363418958316196@newsletter",
                    newsletterName: "𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏",
                    serverMessageId: 200
                },
                externalAdReply: {
                    title: "👤 Owner Menu",
                    body: "𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏 - Owner Commands",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VarnKxpE93pumJ3TkH0M",
                    thumbnailUrl: "https://i.ibb.co/0QHxFwT/app.png"
                }
            }
        }, { quoted: msg });
    }
};
