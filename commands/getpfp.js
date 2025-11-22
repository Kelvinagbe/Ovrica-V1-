// ============================================
// FILE 2: commands/getpfp.js - Get Profile Picture
// ============================================

module.exports = {
    name: 'getpfp',
    admin: false,
    description: 'Get user profile picture',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            // Get target user
            let targetJid;
            
            // Check if replying to someone
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = msg.message.extendedTextMessage.contextInfo.participant;
            }
            // Check if mentioned someone
            else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // Check if number provided in args
            else if (args[0]) {
                const number = args[0].replace(/[^0-9]/g, '');
                targetJid = number + '@s.whatsapp.net';
            }
            // Use sender's own profile
            else {
                targetJid = from.endsWith('@g.us') ? msg.key.participant : from;
            }
            
            const number = targetJid.split('@')[0];
            
            await sendWithTyping(sock, from, '⏳ Fetching profile picture...');
            
            try {
                // Get profile picture URL
                const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                
                const response = `┌ ❏ *⌜ PROFILE PICTURE ⌟* ❏
│
├◆ User: +${number}
├◆ Status: ✅ Found
├◆ Quality: High Resolution
└ ❏

> Powered by 🎭Kelvin🎭`;
                
                // Send the profile picture
                await sock.sendMessage(from, {
                    image: { url: ppUrl },
                    caption: response
                });
                
            } catch (error) {
                if (error.output?.statusCode === 404) {
                    const response = `┌ ❏ *⌜ NO PROFILE PICTURE ⌟* ❏
│
├◆ User: +${number}
├◆ Status: ❌ No profile picture set
├◆ 
├◆ This user hasn't set a profile picture
├◆ or has hidden it from you.
└ ❏

> Powered by 🎭Kelvin🎭`;
                    
                    await sendWithTyping(sock, from, response);
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            console.error('Error fetching profile picture:', error);
            await sendWithTyping(sock, from, `❌ Error: ${error.message}`);
        }
    }
};