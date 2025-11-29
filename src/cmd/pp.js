// ============================================
// FILE 3: commands/pp.js - Quick Profile Picture Command
// ============================================

module.exports = {
    name: 'pp',
    admin: false,
    description: 'Quick profile picture fetch (reply or mention)',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            let targetJid;
            let targetName = 'User';
            
            // Check for quoted message
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = msg.message.extendedTextMessage.contextInfo.participant;
                targetName = msg.message.extendedTextMessage.contextInfo.pushName || 'User';
            }
            // Check for mention
            else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // Use sender
            else {
                targetJid = from.endsWith('@g.us') ? msg.key.participant : from;
                targetName = msg.pushName || 'You';
            }
            
            const number = targetJid.split('@')[0];
            
            try {
                const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                
                await sock.sendMessage(from, {
                    image: { url: ppUrl },
                    caption: `┌ ❏ *⌜ PROFILE PICTURE ⌟* ❏
│
├◆ Name: ${targetName}
├◆ Number: +${number}
├◆ Status: ✅ Success
└ ❏

> Powered by 🎭Kelvin🎭`
                });
                
            } catch (error) {
                if (error.output?.statusCode === 404) {
                    await sendWithTyping(sock, from, `❌ ${targetName} has no profile picture.`);
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            console.error('Error in pp command:', error);
            await sendWithTyping(sock, from, '❌ Failed to fetch profile picture.');
        }
    }
};