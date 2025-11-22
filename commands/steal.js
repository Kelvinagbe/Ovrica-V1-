// ============================================
// FILE 4: commands/steal.js - Steal Profile Picture
// ============================================

module.exports = {
    name: 'steal',
    admin: true,
    description: 'Steal someone\'s profile picture (reply to their message)',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            let targetJid;
            
            // Check for quoted message
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = msg.message.extendedTextMessage.contextInfo.participant;
            }
            // Check for mention
            else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // Check if number provided
            else if (args[0]) {
                const number = args[0].replace(/[^0-9]/g, '');
                targetJid = number + '@s.whatsapp.net';
            }
            else {
                return await sendWithTyping(sock, from, '❌ Reply to someone or mention them!\nUsage: /steal @user or /steal 234xxx');
            }
            
            const number = targetJid.split('@')[0];
            
            await sendWithTyping(sock, from, '🕵️ Stealing profile picture...');
            
            try {
                const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                
                await sock.sendMessage(from, {
                    image: { url: ppUrl },
                    caption: `┌ ❏ *⌜ PROFILE PICTURE STOLEN ⌟* ❏
│
├◆ Stolen from: +${number}
├◆ Status: ✅ Successfully stolen
├◆ Quality: High Resolution
├◆ 
├◆ 😈 Profile picture acquired!
└ ❏

> Powered by 🎭Kelvin🎭`
                });
                
            } catch (error) {
                if (error.output?.statusCode === 404) {
                    await sendWithTyping(sock, from, '❌ User has no profile picture to steal!');
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            console.error('Error stealing PP:', error);
            await sendWithTyping(sock, from, '❌ Failed to steal profile picture.');
        }
    }
};