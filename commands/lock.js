const { isBotAdmin } = require('../utils/helpers/groupHelpers');

module.exports = {
  name: 'lock',
  description: 'Lock group (only admins can send messages)',
  admin: true,

  exec: async (sock, from, args, msg, isAdmin) => {
    // Check if it's a group
    if (!from.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This command only works in groups!'
      }, { quoted: msg });
    }

    // Check if user is admin
    if (!isAdmin) {
      return await sock.sendMessage(from, {
        text: '❌ Only admins can lock the group!'
      }, { quoted: msg });
    }

    // Check if bot is admin
    const botIsAdmin = await isBotAdmin(sock, from);
    console.log('🔍 Bot admin status:', botIsAdmin); // Debug log
    
    if (!botIsAdmin) {
      return await sock.sendMessage(from, {
        text: '❌ Make me admin first!'
      }, { quoted: msg });
    }

    try {
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, {
        text: '🔒 *Group Locked!*\n\nOnly admins can send messages now.'
      }, { quoted: msg });
      
      console.log(`✅ Group ${from} locked successfully`);
    } catch (error) {
      console.error('❌ Lock error:', error);
      await sock.sendMessage(from, {
        text: `❌ Failed to lock group: ${error.message}`
      }, { quoted: msg });
    }
  }
};