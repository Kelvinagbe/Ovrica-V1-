module.exports.common = {
    name: 'common',
    description: 'Find common participants in two groups',
    admin: false,
    ownerOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const jids = parseJid(args.join(' '));
            
            let group1, group2;
            
            if (jids.length > 1) {
                group1 = jids[0].includes('@g.us') ? jids[0] : from;
                group2 = jids[1].includes('@g.us') ? jids[1] : from;
            } else if (jids.length === 1) {
                group1 = from;
                group2 = jids[0].includes('@g.us') ? jids[0] : from;
            } else {
                return await sendWithTyping(sock, from, '❌ Please provide a group JID!');
            }
            
            if (group1 === group2) {
                return await sendWithTyping(sock, from, '❌ Please provide different group JIDs!');
            }
            
            const metadata1 = await sock.groupMetadata(group1);
            const metadata2 = await sock.groupMetadata(group2);
            
            const common = metadata1.participants.filter(p1 => 
                metadata2.participants.some(p2 => p2.id === p1.id)
            );
            
            if (common.length === 0) {
                return await sendWithTyping(sock, from, '✅ No common participants found!');
            }
            
            let responseText = `👥 *Common Participants*\n\n`;
            responseText += `*Group 1:* ${metadata1.subject}\n`;
            responseText += `*Group 2:* ${metadata2.subject}\n`;
            responseText += `*Common:* ${common.length} members\n\n`;
            
            const mentions = [];
            common.forEach((participant, index) => {
                responseText += `${index + 1}. @${participant.id.split('@')[0]}\n`;
                mentions.push(participant.id);
            });
            
            await sock.sendMessage(from, {
                text: responseText,
                mentions: mentions
            });
        } catch (error) {
            console.error('Common command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred while finding common participants.');
        }
    }
};