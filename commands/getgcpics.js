module.exports.gpp = {
    name: 'gpp',
    description: 'Set group profile picture',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const groupAdmins = await getAdmins(sock, from);
            
            if (!groupAdmins.includes(botNumber)) {
                return await sendWithTyping(sock, from, '❌ I need to be an admin to change group picture!');
            }
            
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quotedMsg?.imageMessage) {
                return await sendWithTyping(sock, from, '❌ Please reply to an image to set as group picture!');
            }
            
            const imageBuffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
            
            await sock.updateProfilePicture(from, imageBuffer);
            await sendWithTyping(sock, from, '✅ Group profile picture updated successfully!');
        } catch (error) {
            console.error('GPP command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to update group profile picture.');
        }
    }
};
