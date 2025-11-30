const { isBotAdmin, getMentionedJids, getQuotedParticipant } = require('@/utils/helpers/groupHelpers');

module.exports = {
  name: 'kick',
  description: 'Kick user from group - Usage: !kick @user or reply to message',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can kick members!');
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
      return await sendWithTyping(sock, from, '❌ Tag someone or reply to their message!\n\nUsage: !kick @user');
    }

    try {
      await sock.groupParticipantsUpdate(from, targetUsers, 'remove');
      await sendWithTyping(sock, from, '✅ User(s) kicked from group!');
    } catch (error) {
      console.error('Kick error:', error);
      await sendWithTyping(sock, from, '❌ Failed to kick user(s).');
    }
  }
};