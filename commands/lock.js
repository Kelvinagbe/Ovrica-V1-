// commands/lock.js - Enhanced debugging version
module.exports = {
    name: 'lock',
    description: 'Lock group - only admins can send messages',
    admin: false, // Don't use config admin check

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        console.log('\n');
        console.log('================================');
        console.log('🔒 LOCK COMMAND TRIGGERED');
        console.log('================================');

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

            // Step 2: Get sender ID - TRY MULTIPLE METHODS
            console.log('\nStep 2 - Getting sender ID...');
            console.log('msg.key:', JSON.stringify(msg.key, null, 2));
            
            const sender = msg.key.participant || msg.key.remoteJid;
            console.log('Extracted sender:', sender);

            // Step 3: Get group metadata
            console.log('\nStep 3 - Getting group metadata...');
            const groupMetadata = await sock.groupMetadata(from);
            console.log('Group name:', groupMetadata.subject);
            console.log('Total participants:', groupMetadata.participants.length);

            // Step 4: Show ALL participants and their admin status
            console.log('\n========== ALL PARTICIPANTS ==========');
            groupMetadata.participants.forEach((p, i) => {
                const isThisSender = p.id === sender;
                console.log(`${i+1}. ${p.id}`);
                console.log(`   Admin: ${p.admin || 'none'}`);
                console.log(`   Is sender: ${isThisSender ? '✅ YES' : 'no'}`);
                console.log('');
            });
            console.log('======================================\n');

            // Step 5: Find sender in participants - MULTIPLE METHODS
            console.log('Step 5 - Finding sender in participants...');
            console.log('Looking for sender:', sender);
            
            let senderParticipant = groupMetadata.participants.find(p => p.id === sender);
            
            // If not found, try alternative matching
            if (!senderParticipant) {
                console.log('⚠️ Direct match failed, trying alternative methods...');
                
                const senderNumber = sender.split('@')[0].split(':')[0];
                console.log('Extracted sender number:', senderNumber);
                
                senderParticipant = groupMetadata.participants.find(p => {
                    const pNumber = p.id.split('@')[0].split(':')[0];
                    const match = pNumber === senderNumber;
                    if (match) {
                        console.log(`✅ Match found: ${p.id}`);
                    }
                    return match;
                });
            }
            
            if (!senderParticipant) {
                console.log('❌ SENDER NOT FOUND IN PARTICIPANTS!');
                await sock.sendMessage(from, { 
                    text: '❌ Error: Could not verify your group status.\n\nDebug: Sender not found in participants.' 
                });
                return;
            }
            
            console.log('✅ Sender found:', senderParticipant.id);
            console.log('Sender admin status:', senderParticipant.admin);
            
            const senderIsGroupAdmin = senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin';
            console.log('Sender is GROUP admin:', senderIsGroupAdmin);
            
            if (!senderIsGroupAdmin) {
                await sock.sendMessage(from, { 
                    text: '❌ Only group admins can lock the group!\n\n' +
                          `Your status: ${senderParticipant.admin || 'member'}` 
                });
                return;
            }

            // Step 6: Find bot - FIXED FOR @lid FORMAT
            console.log('\nStep 6 - Finding bot in participants...');
            console.log('sock.user.id:', sock.user.id);
            
            // Extract all possible bot identifiers
            const botFullId = sock.user.id; // e.g., 234810:9860102:14@s.whatsapp.net
            const botParts = botFullId.split(':');
            const botNumber = botParts[0]; // First part before first colon
            
            console.log('Bot number extracted:', botNumber);
            console.log('All participants:');
            groupMetadata.participants.forEach((p, i) => {
                console.log(`  ${i+1}. ${p.id} - Admin: ${p.admin || 'none'}`);
            });
            
            console.log('\nSearching for bot in participants...');
            let botParticipant = null;
            
            // Try matching bot number with participant IDs
            botParticipant = groupMetadata.participants.find(p => {
                // Extract number from participant ID (handles @lid, @s.whatsapp.net, etc)
                const pId = p.id.split('@')[0].split(':')[0];
                const match = pId === botNumber || p.id.includes(botNumber);
                
                if (match) {
                    console.log(`✅ Bot found: ${p.id} (matches bot number ${botNumber})`);
                }
                
                return match;
            });
            
            if (!botParticipant) {
                console.log('\n❌ BOT NOT FOUND IN PARTICIPANTS!');
                console.log('This means the bot is not actually a member of this group.');
                console.log('Bot number searched:', botNumber);
                console.log('Bot full ID:', botFullId);
                console.log('\n⚠️ IMPORTANT: Make sure you add the bot number to the group!');
                console.log(`⚠️ Bot WhatsApp number starts with: ${botNumber}`);
                
                await sock.sendMessage(from, { 
                    text: `❌ *Bot Not in Group!*\n\n` +
                          `The bot is not a member of this group.\n\n` +
                          `*To fix this:*\n` +
                          `1. Add bot number: +${botNumber}...\n` +
                          `2. Make the bot an admin\n` +
                          `3. Try the /lock command again\n\n` +
                          `*Note:* The bot can only control groups it's a member of.`
                });
                return;
            }
            
            console.log('✅ Bot found:', botParticipant.id);
            console.log('Bot admin status:', botParticipant.admin);

            const botIsAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
            
            if (!botIsAdmin) {
                await sock.sendMessage(from, { 
                    text: '❌ I need to be a group admin to lock the group!\n\nPlease make me an admin first.' 
                });
                return;
            }

            // Step 7: Lock the group
            console.log('\nStep 7 - Locking group...');
            await sock.groupSettingUpdate(from, 'announcement');
            console.log('✅ Group locked!');

            await sock.sendMessage(from, { 
                text: '🔒 *Group Locked!*\n\nOnly admins can send messages now.' 
            });

            console.log('================================');
            console.log('✅ LOCK COMMAND COMPLETED');
            console.log('================================\n');

        } catch (error) {
            console.error('\n❌ ERROR:');
            console.error(error);
            
            await sock.sendMessage(from, { 
                text: `❌ Error: ${error.message}` 
            });
        }
    }
};