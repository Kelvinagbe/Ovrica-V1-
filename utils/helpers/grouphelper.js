const { downloadMediaMessage } = require('@whiskeysockets/baileys');

/**
 * Check if user is admin
 */
async function isAdmin(sock, groupId, userId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const participant = groupMetadata.participants.find(p => p.id === userId);
    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
  } catch (error) {
    console.error('Error checking admin:', error);
    return false;
  }
}

/**
 * Check if bot is admin
 */
async function isBotAdmin(sock, groupId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const participant = groupMetadata.participants.find(p => p.id === botId);
    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
  } catch (error) {
    console.error('Error checking bot admin:', error);
    return false;
  }
}

/**
 * Extract mentioned users
 */
function getMentionedJids(msg) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  return mentioned;
}

/**
 * Get quoted message participant
 */
function getQuotedParticipant(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.participant || null;
}

module.exports = {
  isAdmin,
  isBotAdmin,
  getMentionedJids,
  getQuotedParticipant
};
