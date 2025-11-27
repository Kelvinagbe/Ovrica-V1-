// commands/lock.js - Lock group (only admins can send messages)
const { isBotAdmin } = require('../utils/helpers/groupHelpers');

module.exports = {
    name: 'lock',
    description: 'Lock group (only admins can send messages)',
    admin: true,

    exec: async (sock, from, args, msg, isAdmin) => {
        console.log('🔒 Lock command started');
        console.log('📍 From:', from);
        console.log('👤 Is Admin:', isAdmin);

        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            console.log('❌ Not a group');
            return await sock.sendMessage(from, {
                text: '❌ This command only works in groups!'
            }, { quoted: msg });
        }

        // Check if user is admin (already handled by command handler)
        if (!isAdmin) {
            console.log('❌ User not admin');
            return await sock.sendMessage(from, {
                text: '❌ Only admins can lock the group!'
            }, { quoted: msg });
        }

        // Check if bot is admin
        console.log('🔍 Checking bot admin status...');
        const botIsAdmin = await isBotAdmin(sock, from);
        console.log('🤖 Bot is admin:', botIsAdmin);
        
        if (!botIsAdmin) {
            return await sock.sendMessage(from, {
                text: '❌ Make me admin first!'
            }, { quoted: msg });
        }

        try {
            console.log('🔒 Locking group...');
            await sock.groupSettingUpdate(from, 'announcement');
            
            await sock.sendMessage(from, {
                text: '🔒 *Group Locked!*\n\nOnly admins can send messages now.'
            }, { quoted: msg });
            
            console.log('✅ Group locked successfully');
        } catch (error) {
            console.error('❌ Lock error:', error);
            await sock.sendMessage(from, {
                text: `❌ Failed to lock group.\n\nError: ${error.message}`
            }, { quoted: msg });
        }
    }
};