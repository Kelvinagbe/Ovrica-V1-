const { isBotAdmin, getMentionedJids, getQuotedParticipant } = require('../utils/groupHelpers');

module.exports = {
  name: 'promote',
  description: 'Make user admin - Usage: !promote @user or reply to message',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can promote members!');
    }

    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ Make me admin first!');
    }

    let targetUsers = getMentionedJids(msg);
    
    if (targetUsers.length === 0) {
      const quotedUser = getQuotedParticipant(msg);
      if (quotedUser) {
        targetUsers = [quotedUser];
      }
    }

    if (targetUsers.length === 0) {
      return await sendWithTyping(sock, from, '❌ Tag someone or reply to their message!\n\nUsage: !promote @user');
    }

    try {
      await sock.groupParticipantsUpdate(from, targetUsers, 'promote');
      await sendWithTyping(sock, from, '✅ User(s) promoted to admin!');
    } catch (error) {
      console.error('Promote error:', error);
      await sendWithTyping(sock, from, '❌ Failed to promote user(s).');
    }
  }
};
