const { isBotAdmin } = require('../utils/helpers/groupHelpers');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'gcpics',
  description: 'Change group profile picture - Reply to an image with !profile',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ This command only works in groups!');
    }

    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ Only admins can change profile picture!');
    }

    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ Make me admin first!');
    }

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isImage = quotedMsg?.imageMessage;

    if (!isImage) {
      return await sendWithTyping(sock, from, '❌ Please reply to an image with !profile');
    }

    try {
      await sendWithTyping(sock, from, '⏳ Updating profile picture...');

      const buffer = await downloadMediaMessage(
        { message: quotedMsg },
        'buffer',
        {}
      );

      await sock.updateProfilePicture(from, buffer);
      await sendWithTyping(sock, from, '✅ *Group Profile Picture Updated!*');
    } catch (error) {
      console.error('Profile error:', error);
      await sendWithTyping(sock, from, '❌ Failed to update profile picture.');
    }
  }
};
