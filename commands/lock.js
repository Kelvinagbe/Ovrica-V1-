// commands/lock.js
module.exports = {
    name: 'lock',
    description: 'Lock group - only admins can send messages',
    admin: false,

    exec: async (sock, from, args, msg, isAdmin) => {
        console.log('\n');
        console.log('================================');
        console.log('🔒 LOCK COMMAND TRIGGERED');
        console.log('================================');
        console.log('From:', from);
        console.log('User is admin:', isAdmin);
        console.log('================================\n');

        try {
            // Step 1: Check if group
            const isGroup = from.endsWith('@g.us');
            console.log('Step 1 - Is group:', isGroup);
            
            if (!isGroup) {
                await sock.sendMessage(from, { 
                    text: '❌ This command only works in groups!' 
                });
                return;
            }

            // Step 2: Check user admin (already done by handler)
            console.log('Step 2 - User admin check:', isAdmin);
            
            if (!isAdmin) {
                await sock.sendMessage(from, { 
                    text: '❌ You must be an admin to use this command!' 
                });
                return;
            }

            // Step 3: Get group metadata
            console.log('Step 3 - Getting group metadata...');
            const groupMetadata = await sock.groupMetadata(from);
            console.log('Group name:', groupMetadata.subject);
            console.log('Total participants:', groupMetadata.participants.length);

            // Step 4: Find bot in participants
            console.log('\nStep 4 - Finding bot in participants...');
            console.log('Bot user ID:', sock.user.id);
            
            const botNumber = sock.user.id.split(':')[0];
            console.log('Bot number:', botNumber);
            
            // Try to find bot
            let botParticipant = null;
            
            // Method 1: Direct match
            botParticipant = groupMetadata.participants.find(p => 
                p.id === `${botNumber}@s.whatsapp.net`
            );
            
            // Method 2: Split and match
            if (!botParticipant) {
                botParticipant = groupMetadata.participants.find(p => 
                    p.id.split('@')[0] === botNumber || 
                    p.id.split(':')[0] === botNumber
                );
            }
            
            console.log('\nAll participants:');
            groupMetadata.participants.forEach((p, i) => {
                console.log(`  ${i+1}. ${p.id} - Admin: ${p.admin || 'no'}`);
            });
            
            if (!botParticipant) {
                console.log('\n❌ ERROR: Bot not found in participants!');
                await sock.sendMessage(from, { 
                    text: '❌ Error: Bot not found in group participants. Try removing and re-adding the bot.' 
                });
                return;
            }
            
            console.log('\n✅ Bot found:', botParticipant.id);
            console.log('Bot admin status:', botParticipant.admin);

            // Step 5: Check if bot is admin
            const botIsAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
            console.log('Bot is admin:', botIsAdmin);
            
            if (!botIsAdmin) {
                await sock.sendMessage(from, { 
                    text: '❌ I need to be a group admin to lock the group!\n\nPlease make me an admin first.' 
                });
                return;
            }

            // Step 6: Lock the group
            console.log('\nStep 6 - Locking group...');
            await sock.groupSettingUpdate(from, 'announcement');
            console.log('✅ Group locked successfully!');

            // Step 7: Send confirmation
            await sock.sendMessage(from, { 
                text: '🔒 *Group Locked!*\n\nOnly admins can send messages now.' 
            });

            console.log('================================');
            console.log('✅ LOCK COMMAND COMPLETED');
            console.log('================================\n');

        } catch (error) {
            console.error('\n❌ ERROR IN LOCK COMMAND:');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('================================\n');
            
            await sock.sendMessage(from, { 
                text: `❌ Error: ${error.message}` 
            });
        }
    }
};