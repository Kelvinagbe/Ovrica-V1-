module.exports = {
    name: 'jid',
    admin: false,
    description: 'Get full JID of current chat/user/group',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            // Helper function for fancy reply
            const sendFancyReply = async (text, quoted = msg) => {
                return await sock.sendMessage(from, {
                    text: text,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "🆔 JID Information",
                            body: "OVRICA WhatsApp Bot",
                            thumbnailUrl: "icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: quoted });
            };
            
            const sender = from.endsWith('@g.us') ? msg.key.participant : from;
            const isGroup = from.endsWith('@g.us');
            const isChannel = from.endsWith('@newsletter');
            
            let jidText = '';
            let title = '';
            let icon = '';
            
            if (isChannel) {
                jidText = from;
                title = 'CHANNEL JID';
                icon = '📢';
            } else if (isGroup) {
                jidText = from;
                title = 'GROUP JID';
                icon = '👥';
            } else {
                jidText = sender;
                title = 'USER JID';
                icon = '👤';
            }
            
            const response = `┌ ❏ *⌜ ${title} ⌟* ❏
│
├◆ ${icon} JID:
├◆ \`\`\`${jidText}\`\`\`
├◆ 
├◆ Type: ${isChannel ? 'Channel' : isGroup ? 'Group Chat' : 'Private Chat'}
├◆ Format: ${jidText.split('@')[1]}
├◆ Status: ✅ Active
└ ❏

> Powered by 🎭Kelvin🎭`;
            
            await sendFancyReply(response);
            
            console.log(`🆔 JID retrieved: ${jidText}`);
            
        } catch (error) {
            console.error('❌ JID command error:', error);
            await sendWithTyping(sock, from, `❌ Error fetching JID:\n${error.message}`);
        }
    }
};
