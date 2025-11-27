const { isBotAdmin } = require('../utils/helpers/groupHelpers');

module.exports = {
  name: 'gcadd',
  description: 'Add user to group - Usage: !add <phone number>',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can add members!');
    }

    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ Make me admin first!');
    }

    if (args.length === 0) {
      return await sendWithTyping(sock, from, '❌ Usage: !add <phone number>\n\nExample: !add 1234567890');
    }

    const number = args[0].replace(/[^0-9]/g, '');
    const targetUser = number + '@s.whatsapp.net';

    try {
      const response = await sock.groupParticipantsUpdate(from, [targetUser], 'add');
      
      if (response[0].status === '200') {
        await sendWithTyping(sock, from, '✅ User added to group!');
      } else if (response[0].status === '403') {
        await sendWithTyping(sock, from, '❌ Cannot add this user. They may have privacy settings enabled.');
      } else {
        await sendWithTyping(sock, from, '❌ Failed to add user.');
      }
    } catch (error) {
      console.error('Add error:', error);
      await sendWithTyping(sock, from, '❌ Failed to add user.');
    }
  }
};