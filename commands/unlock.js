const { isBotAdmin } = require('../utils/groupHelpers');

module.exports = {
  name: 'unlock',
  description: 'Unlock group (everyone can send messages)',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can unlock the group!');
    }

    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ Make me admin first!');
    }

    try {
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sendWithTyping(sock, from, '🔓 *Group Unlocked!*\n\nEveryone can send messages now.');
    } catch (error) {
      console.error('Unlock error:', error);
      await sendWithTyping(sock, from, '❌ Failed to unlock group.');
    }
  }
};
