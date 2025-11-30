const { isBotAdmin } = require('@/utils/helpers/groupHelpers');

module.exports = {
  name: 'description',
  description: 'Change group description - Usage: !description <new description>',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can change description!');
    }

    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ Make me admin first!');
    }

    const newDesc = args.join(' ');
    if (!newDesc) {
      return await sendWithTyping(sock, from, '❌ Usage: !description <new description>');
    }

    try {
      await sock.groupUpdateDescription(from, newDesc);
      await sendWithTyping(sock, from, `✅ *Description Updated!*\n\n${newDesc}`);
    } catch (error) {
      console.error('Description error:', error);
      await sendWithTyping(sock, from, '❌ Failed to update description.');
    }
  }
};