// commands/online.js - Standalone online users command
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'listonline',
    description: 'Show all online users in the group with real-time status',
    admin: false,

    async exec(sock, from, args, msg, isAdmin) {
        try {
            // Group check
            if (!from.endsWith('@g.us')) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ GROUP ONLY ⌟* ❏
│
├◆ ⚠️ This command only works in groups
├◆ 💡 Add me to a group first
│
└ ❏`
                }, { quoted: msg });
            }

            // Send initial message
            const loadingMsg = await sock.sendMessage(from, {
                text: `⏳ *Scanning online users...*\n\n🔄 Initializing...`
            }, { quoted: msg });

            // Get group metadata
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            const totalMembers = participants.length;

            // Batch configuration for optimal performance
            const BATCH_SIZE = 10;
            const BATCH_DELAY = 500; // ms between batches
            const onlineUsers = [];
            const typingUsers = [];
            const recordingUsers = [];
            let processedCount = 0;

            // Process in optimized batches
            for (let i = 0; i < participants.length; i += BATCH_SIZE) {
                const batch = participants.slice(i, i + BATCH_SIZE);
                
                // Process batch in parallel
                const batchResults = await Promise.allSettled(
                    batch.map(async (participant) => {
                        try {
                            // Subscribe to presence
                            await sock.presenceSubscribe(participant.id);
                            
                            // Small delay for presence to update
                            await delay(100);
                            
                            // Get presence status
                            const presence = await sock.getPresence(participant.id);
                            const presenceStatus = presence?.lastKnownPresence;
                            
                            const userInfo = {
                                jid: participant.id,
                                name: participant.notify || participant.id.split('@')[0],
                                number: participant.id.split('@')[0],
                                admin: participant.admin,
                                status: presenceStatus
                            };

                            // Categorize by status
                            if (presenceStatus === 'available') {
                                return { type: 'online', data: userInfo };
                            } else if (presenceStatus === 'composing') {
                                return { type: 'typing', data: userInfo };
                            } else if (presenceStatus === 'recording') {
                                return { type: 'recording', data: userInfo };
                            }
                            
                            return null;

                        } catch (error) {
                            return null;
                        }
                    })
                );

                // Collect results
                batchResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        const { type, data } = result.value;
                        if (type === 'online') onlineUsers.push(data);
                        else if (type === 'typing') typingUsers.push(data);
                        else if (type === 'recording') recordingUsers.push(data);
                    }
                });

                processedCount += batch.length;

                // Update progress
                const progress = Math.round((processedCount / totalMembers) * 100);
                await sock.sendMessage(from, {
                    text: `⏳ *Scanning online users...*\n\n📊 Progress: ${processedCount}/${totalMembers} (${progress}%)\n🟢 Found: ${onlineUsers.length + typingUsers.length + recordingUsers.length}`,
                    edit: loadingMsg.key
                });

                // Delay between batches to avoid rate limits
                if (i + BATCH_SIZE < participants.length) {
                    await delay(BATCH_DELAY);
                }
            }

            // Calculate totals
            const totalOnline = onlineUsers.length + typingUsers.length + recordingUsers.length;
            const totalOffline = totalMembers - totalOnline;

            // Build response with mentions
            let responseText = `┌ ❏ *⌜ WHO'S ONLINE ⌟* ❏\n│\n`;
            responseText += `├◆ 📊 Total Members: ${totalMembers}\n`;
            responseText += `├◆ 🟢 Online: ${totalOnline}\n`;
            responseText += `├◆ ⚪ Offline: ${totalOffline}\n`;
            responseText += `├◆ 📈 Online Rate: ${Math.round((totalOnline/totalMembers)*100)}%\n`;
            responseText += `│\n`;

            const allMentions = [];

            // Show online users
            if (onlineUsers.length > 0) {
                responseText += `├◆ *🟢 ONLINE (${onlineUsers.length}):*\n`;
                onlineUsers.forEach((user, index) => {
                    const adminBadge = user.admin ? '👑 ' : '';
                    responseText += `├◆ ${index + 1}. ${adminBadge}@${user.number}\n`;
                    allMentions.push(user.jid);
                });
                responseText += `│\n`;
            }

            // Show typing users
            if (typingUsers.length > 0) {
                responseText += `├◆ *✍️ TYPING (${typingUsers.length}):*\n`;
                typingUsers.forEach((user, index) => {
                    const adminBadge = user.admin ? '👑 ' : '';
                    responseText += `├◆ ${index + 1}. ${adminBadge}@${user.number}\n`;
                    allMentions.push(user.jid);
                });
                responseText += `│\n`;
            }

            // Show recording users
            if (recordingUsers.length > 0) {
                responseText += `├◆ *🎤 RECORDING (${recordingUsers.length}):*\n`;
                recordingUsers.forEach((user, index) => {
                    const adminBadge = user.admin ? '👑 ' : '';
                    responseText += `├◆ ${index + 1}. ${adminBadge}@${user.number}\n`;
                    allMentions.push(user.jid);
                });
                responseText += `│\n`;
            }

            // No online users message
            if (totalOnline === 0) {
                responseText += `├◆ 💤 No users currently online\n`;
                responseText += `├◆ 💡 Try again in a few moments\n`;
                responseText += `│\n`;
            }

            responseText += `├◆ ⏰ Scanned at: ${new Date().toLocaleTimeString()}\n`;
            responseText += `├◆ 💡 Tip: Status updates every few seconds\n`;
            responseText += `│\n`;
            responseText += `└ ❏\n\n> 🎭 Online Status Scanner`;

            // Send final message with mentions
            await sock.sendMessage(from, {
                text: responseText,
                mentions: allMentions,
                edit: loadingMsg.key
            });

            console.log(`✅ Online check complete: ${totalOnline}/${totalMembers} online`);

        } catch (error) {
            console.error('❌ Online command error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏
│
├◆ ❌ Failed to scan online users
├◆ 💥 Error: ${error.message}
│
├◆ 🔧 Possible causes:
├◆ • API rate limits exceeded
├◆ • Group too large
├◆ • Network connectivity issues
├◆ • Bot permission problems
│
├◆ 💡 Solutions:
├◆ • Wait a moment and try again
├◆ • Check bot permissions
├◆ • Try in smaller groups first
│
└ ❏`
            }, { quoted: msg });
        }
    }
};