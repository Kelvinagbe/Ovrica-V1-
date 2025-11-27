
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'listonline',
    description: 'List all online users in the group',
    admin: false,

    async exec(sock, from, args, msg, isAdmin) {
        try {
            // Check if it's a group
            if (!from.endsWith('@g.us')) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ GROUP ONLY ⌟* ❏
│
├◆ ⚠️ This command only works in groups
├◆ 💡 Add me to a group to use this
│
└ ❏`
                }, { quoted: msg });
            }

            // Send processing message
            const processingMsg = await sock.sendMessage(from, {
                text: `🔍 *Scanning for online users...*\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Get group metadata
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;

            // Get online status for all participants
            const onlineUsers = [];
            const offlineUsers = [];
            let checkedCount = 0;

            for (const participant of participants) {
                try {
                    // Fetch presence/status
                    await sock.presenceSubscribe(participant.id);
                    await delay(100); // Small delay to avoid rate limits

                    // Get the presence
                    const presence = await sock.getPresence(participant.id);
                    
                    // Check if online
                    const isOnline = presence?.lastKnownPresence === 'available' || 
                                   presence?.lastKnownPresence === 'composing' ||
                                   presence?.lastKnownPresence === 'recording';

                    const userInfo = {
                        jid: participant.id,
                        name: participant.notify || participant.id.split('@')[0],
                        admin: participant.admin ? '👑' : '',
                        status: presence?.lastKnownPresence || 'unavailable'
                    };

                    if (isOnline) {
                        onlineUsers.push(userInfo);
                    } else {
                        offlineUsers.push(userInfo);
                    }

                    checkedCount++;

                    // Update progress every 10 users
                    if (checkedCount % 10 === 0) {
                        await sock.sendMessage(from, {
                            text: `🔍 Scanning... ${checkedCount}/${participants.length}`,
                            edit: processingMsg.key
                        });
                    }

                } catch (error) {
                    // Skip if can't get presence
                    offlineUsers.push({
                        jid: participant.id,
                        name: participant.notify || participant.id.split('@')[0],
                        admin: participant.admin ? '👑' : '',
                        status: 'unknown'
                    });
                }
            }

            // Build response message
            let responseText = `┌ ❏ *⌜ ONLINE USERS ⌟* ❏\n│\n`;
            responseText += `├◆ 📊 Total Members: ${participants.length}\n`;
            responseText += `├◆ 🟢 Online: ${onlineUsers.length}\n`;
            responseText += `├◆ ⚪ Offline: ${offlineUsers.length}\n`;
            responseText += `│\n`;

            if (onlineUsers.length > 0) {
                responseText += `├◆ *🟢 ONLINE USERS:*\n`;
                onlineUsers.forEach((user, index) => {
                    const statusEmoji = user.status === 'composing' ? '✍️' : 
                                      user.status === 'recording' ? '🎤' : '🟢';
                    responseText += `├◆ ${index + 1}. ${user.admin}${user.name} ${statusEmoji}\n`;
                });
                responseText += `│\n`;
            } else {
                responseText += `├◆ *🟢 ONLINE USERS:*\n`;
                responseText += `├◆ No users currently online\n`;
                responseText += `│\n`;
            }

            // Option to show offline users
            if (args[0] === 'all' && offlineUsers.length > 0) {
                responseText += `├◆ *⚪ OFFLINE USERS:*\n`;
                offlineUsers.slice(0, 20).forEach((user, index) => {
                    responseText += `├◆ ${index + 1}. ${user.admin}${user.name}\n`;
                });
                if (offlineUsers.length > 20) {
                    responseText += `├◆ ... and ${offlineUsers.length - 20} more\n`;
                }
                responseText += `│\n`;
            }

            responseText += `├◆ 💡 Use /online all to see offline users\n`;
            responseText += `│\n`;
            responseText += `└ ❏\n\n> 🎭 Online Status Check`;

            // Send final message
            await sock.sendMessage(from, {
                text: responseText,
                edit: processingMsg.key
            });

            console.log(`✅ Online check: ${onlineUsers.length}/${participants.length}`);

        } catch (error) {
            console.error('❌ Online command error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏
│
├◆ ❌ Failed to check online users
├◆ 💥 ${error.message}
│
├◆ 💡 Possible reasons:
├◆ • Bot doesn't have permission
├◆ • WhatsApp API limitations
├◆ • Too many members in group
│
└ ❏`
            }, { quoted: msg });
        }
    }
};
