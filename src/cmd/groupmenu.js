const { generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'groupmenu',
    admin: false,
    description: 'Group commands',
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const text = `╔══[❏⧉ *👥 GROUP MENU* ⧉❏]
║
║ *Admin Only:*
║➲ .add - Add member
║➲ .kick - Remove member
║➲ .promote - Make admin
║➲ .demote - Remove admin
║➲ .setname - Change group name
║➲ .setdesc - Set description
║➲ .setpp - Change group icon
║
║ *Group Actions:*
║➲ .tagall - Tag everyone
║➲ .hidetag - Hidden tag
║➲ .groupinfo - Group details
║➲ .link - Get group link
║➲ .revoke - Reset group link
║
║ *Settings:*
║➲ .antilink - Toggle antilink
║➲ .antidelete - Toggle antidelete
║➲ .welcome - Toggle welcome
║➲ .mute - Mute group
║➲ .unmute - Unmute group
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
                    title: "👥 Group Menu",
                    body: "𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏 - Group Commands",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VarnKxpE93pumJ3TkH0M",
                    thumbnailUrl: "https://i.ibb.co/0QHxFwT/app.png"
                }
            }
        }, { quoted: msg });
    }
};