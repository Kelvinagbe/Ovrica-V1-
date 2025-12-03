// commands/lock.js
module.exports = {
    name: 'lock',
    description: 'Lock group - only admins can send messages',
    admin: true,

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const isGroup = from.endsWith('@g.us');
            
            if (!isGroup) {
                await sock.sendMessage(from, { 
                    text: '❌ This command only works in groups!' 
                });
                return;
            }

            const sender = msg.key.participant || msg.key.remoteJid;
            const groupMetadata = await sock.groupMetadata(from);

            let senderParticipant = groupMetadata.participants.find(p => p.id === sender);

            if (!senderParticipant) {
                const senderNumber = sender.split('@')[0].split(':')[0];
                senderParticipant = groupMetadata.participants.find(p => {
                    const pNumber = p.id.split('@')[0].split(':')[0];
                    return pNumber === senderNumber;
                });
            }

            if (!senderParticipant) {
                await sock.sendMessage(from, { 
                    text: '❌ Error: Could not verify your group status.' 
                });
                return;
            }

            const senderIsGroupAdmin = senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin';

            if (!senderIsGroupAdmin) {
                await sock.sendMessage(from, { 
                    text: `❌ Only group admins can lock the group!\n\nYour status: ${senderParticipant.admin || 'member'}` 
                });
                return;
            }

            const botFullId = sock.user.id;
            const botNumber = botFullId.split(':')[0];
            
            let botParticipant = groupMetadata.participants.find(p => p.id === botFullId);

            if (!botParticipant) {
                botParticipant = groupMetadata.participants.find(p => {
                    return p.id.includes(botNumber) || p.id.split(':')[0] === botNumber;
                });
            }

            if (!botParticipant) {
                botParticipant = groupMetadata.participants.find(p => 
                    p.admin === 'admin' || p.admin === 'superadmin'
                );
            }

            if (!botParticipant) {
                await sock.sendMessage(from, { 
                    text: `❌ *Cannot determine bot status in group*\n\n` +
                          `This might be because:\n` +
                          `• Bot is running on a linked device\n` +
                          `• Bot ID format doesn't match participants\n\n` +
                          `Try adding the bot directly to the group.`
                });
                return;
            }

            const botIsAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';

            if (!botIsAdmin) {
                await sock.sendMessage(from, { 
                    text: '❌ I need to be a group admin to lock the group!\n\nPlease make me an admin first.' 
                });
                return;
            }

            await sock.groupSettingUpdate(from, 'announcement');

            await sock.sendMessage(from, { 
                text: '🔒 *Group Locked!*\n\nOnly admins can send messages now.' 
            });

        } catch (error) {
            await sock.sendMessage(from, { 
                text: `❌ Error: ${error.message}` 
            });
        }
    }
};