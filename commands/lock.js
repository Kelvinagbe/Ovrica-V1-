const { isBotAdmin } = require('../utils/helpers/groupHelpers');

module.exports = {
  name: 'lock',
  description: 'Lock group (only admins can send messages)',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    // Check if it's a group
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    // Check if user is admin (already handled by isAdmin param)
    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can lock the group!');
    }

    // Check if bot is admin
    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ Make me admin first!');
    }

    try {
      await sock.groupSettingUpdate(from, 'announcement');
      await sendWithTyping(sock, from, '🔒 *Group Locked!*\n\nOnly admins can send messages now.');
    } catch (error) {
      console.error('Lock error:', error);
      await sendWithTyping(sock, from, '❌ Failed to lock group.');
    }
  }
};
