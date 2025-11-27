// commands/unlock.js
module.exports = {
    name: 'unlock',
    description: 'Unlock group - everyone can send messages',
    admin: true,

    exec: async (sock, from, args, msg, isAdmin) => {
        console.log('\n🔓 UNLOCK COMMAND TRIGGERED\n');

        try {
            // Check if group
            if (!from.endsWith('@g.us')) {
                await sock.sendMessage(from, { 
                    text: '❌ This command only works in groups!' 
                });
                return;
            }

            // Check user admin
            if (!isAdmin) {
                await sock.sendMessage(from, { 
                    text: '❌ You must be an admin to use this command!' 
                });
                return;
            }

            // Get group metadata and check bot admin
            const groupMetadata = await sock.groupMetadata(from);
            const botNumber = sock.user.id.split(':')[0];
            
            let botParticipant = groupMetadata.participants.find(p => 
                p.id === `${botNumber}@s.whatsapp.net` ||
                p.id.split('@')[0] === botNumber || 
                p.id.split(':')[0] === botNumber
            );
            
            if (!botParticipant) {
                await sock.sendMessage(from, { 
                    text: '❌ Error: Bot not found in group.' 
                });
                return;
            }
            
            const botIsAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
            
            if (!botIsAdmin) {
                await sock.sendMessage(from, { 
                    text: '❌ I need to be a group admin to unlock the group!' 
                });
                return;
            }

            // Unlock the group
            await sock.groupSettingUpdate(from, 'not_announcement');
            
            await sock.sendMessage(from, { 
                text: '🔓 *Group Unlocked!*\n\nEveryone can send messages now.' 
            });

            console.log('✅ Group unlocked successfully\n');

        } catch (error) {
            console.error('❌ Unlock error:', error.message);
            await sock.sendMessage(from, { 
                text: `❌ Error: ${error.message}` 
            });
        }
    }
};