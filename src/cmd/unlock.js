
module.exports = {
    name: 'unlock',
    description: 'Unlock group - everyone can send messages',
    admin: false,

    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            if (!from.endsWith('@g.us')) {
                return await sock.sendMessage(from, {
                    text: '❌ This command only works in groups!'
                });
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
                return await sock.sendMessage(from, {
                    text: '❌ Could not verify your group membership.'
                });
            }

            const senderIsAdmin = senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin';

            if (!senderIsAdmin) {
                return await sock.sendMessage(from, {
                    text: '❌ Only group admins can unlock the group!'
                });
            }

            try {
                await sock.groupSettingUpdate(from, 'not_announcement');

                await sock.sendMessage(from, {
                    text: '🔓 *Group Unlocked!*\n\nEveryone can send messages now.'
                });

            } catch (unlockError) {
                if (unlockError.message?.includes('not-authorized') || 
                    unlockError.message?.includes('forbidden') ||
                    unlockError.message?.includes('participant')) {

                    await sock.sendMessage(from, {
                        text: '❌ *Permission Denied*\n\n' +
                              'The bot needs to be a group admin to unlock the group.\n\n' +
                              '*Steps to fix:*\n' +
                              '1. Make the bot a group admin\n' +
                              '2. Try the command again'
                    });
                } else {
                    await sock.sendMessage(from, {
                        text: `❌ Failed to unlock group:\n${unlockError.message}`
                    });
                }
            }

        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message}`
            });
        }
    }
};