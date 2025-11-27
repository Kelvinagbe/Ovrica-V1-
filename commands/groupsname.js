const { isBotAdmin } = require('../utils/groupHelpers');

module.exports = {
  name: 'groupname',
  description: 'Change group name - Usage: !groupname <new name>',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can change group name!');
    }

    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ Make me admin first!');
    }

    const newName = args.join(' ');
    if (!newName) {
      return await sendWithTyping(sock, from, '❌ Usage: !groupname <new name>');
    }

    try {
      await sock.groupUpdateSubject(from, newName);
      await sendWithTyping(sock, from, `✅ *Group Name Changed!*\n\nNew name: *${newName}*`);
    } catch (error) {
      console.error('Group name error:', error);
      await sendWithTyping(sock, from, '❌ Failed to change group name.');
    }
  }
};