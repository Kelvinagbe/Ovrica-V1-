module.exports.setname = {
    name: 'setname',
    alias: ['setgname', 'gname'],
    description: 'Set group name',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const groupAdmins = await getAdmins(sock, from);
            
            if (!groupAdmins.includes(botNumber)) {
                return await sendWithTyping(sock, from, '❌ I need to be an admin to change group name!');
            }
            
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const groupName = args.join(' ');
            
            if (!groupName) {
                return await sendWithTyping(sock, from, '❌ Please provide a group name!');
            }
            
            await sock.groupUpdateSubject(from, groupName);
            await sendWithTyping(sock, from, '✅ Group name updated successfully!');
        } catch (error) {
            console.error('Setname command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to update group name.');
        }
    }
};