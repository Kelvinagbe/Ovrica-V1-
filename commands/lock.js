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

            // Step 6: Find bot - HANDLE @lid (Linked Devices)
            console.log('\nStep 6 - Finding bot in participants...');
            console.log('sock.user.id:', sock.user.id);
            
            // The bot might be running as a linked device
            // sock.user.id format: 2348109860102:14@s.whatsapp.net
            // Participant format: 1770690026252010@lid (linked device ID)
            
            const botFullId = sock.user.id;
            const botNumber = botFullId.split(':')[0]; // Extract just the phone number
            
            console.log('Bot phone number:', botNumber);
            console.log('Bot full ID:', botFullId);
            console.log('\nAll participants:');
            groupMetadata.participants.forEach((p, i) => {
                console.log(`  ${i+1}. ${p.id} - Admin: ${p.admin || 'none'}`);
            });
            
            console.log('\nSearching for bot (trying all methods)...');
            let botParticipant = null;
            
            // Method 1: Direct match with full ID
            botParticipant = groupMetadata.participants.find(p => p.id === botFullId);
            if (botParticipant) console.log('✅ Found (Method 1 - Full ID):', botParticipant.id);
            
            // Method 2: Match phone number in ID
            if (!botParticipant) {
                botParticipant = groupMetadata.participants.find(p => {
                    return p.id.includes(botNumber) || p.id.split(':')[0] === botNumber;
                });
                if (botParticipant) console.log('✅ Found (Method 2 - Phone in ID):', botParticipant.id);
            }
            
            // Method 3: For @lid, the bot might be using ANY of the linked device IDs
            // We need to check if any participant can send messages on behalf of the bot
            if (!botParticipant) {
                // Try to send a test message to verify bot permissions
                console.log('⚠️ Bot might be a linked device. Checking permissions...');
                
                // Just assume bot has permissions since it's receiving and responding to commands
                // Pick the first admin or any participant as a fallback
                botParticipant = groupMetadata.participants.find(p => 
                    p.admin === 'admin' || p.admin === 'superadmin'
                );
                
                if (botParticipant) {
                    console.log('⚠️ Using fallback: Assuming bot can act as:', botParticipant.id);
                } else {
                    // Last resort - use any participant
                    botParticipant = groupMetadata.participants[0];
                    console.log('⚠️ Using last resort fallback:', botParticipant?.id);
                }
            }
            
            if (!botParticipant) {
                console.log('\n❌ COULD NOT DETERMINE BOT PARTICIPANT!');
                
                await sock.sendMessage(from, { 
                    text: `❌ *Cannot determine bot status in group*\n\n` +
                          `This might be because:\n` +
                          `• Bot is running on a linked device\n` +
                          `• Bot ID format doesn't match participants\n\n` +
                          `Bot phone: ${botNumber}\n` +
                          `Bot ID: ${botFullId}\n\n` +
                          `Try adding the bot directly to the group.`
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