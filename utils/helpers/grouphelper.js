// utils/helpers/groupHelpers.js - Group helper functions
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

/**
 * Check if user is admin in a group
 */
async function isAdmin(sock, groupId, userId) {
  try {
    console.log('🔍 isAdmin - Checking if user is admin...');
    console.log('  Group ID:', groupId);
    console.log('  User ID:', userId);

    const groupMetadata = await sock.groupMetadata(groupId);
    console.log('  Total participants:', groupMetadata.participants.length);
    
    const participant = groupMetadata.participants.find(p => p.id === userId);
    
    if (!participant) {
      console.log('  ❌ User not found in group');
      return false;
    }
    
    console.log('  Participant found:', {
      id: participant.id,
      admin: participant.admin
    });
    
    const isAdminUser = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    console.log('  ✅ Is admin:', isAdminUser);
    
    return isAdminUser;
  } catch (error) {
    console.error('❌ Error checking admin:', error);
    return false;
  }
}

/**
 * Check if bot is admin in a group
 */
async function isBotAdmin(sock, groupId) {
  try {
    console.log('\n🤖 isBotAdmin - Checking if bot is admin...');
    console.log('  Group ID:', groupId);

    const groupMetadata = await sock.groupMetadata(groupId);
    
    // Get bot's JID - try multiple formats
    const botNumber = sock.user.id.split(':')[0];
    const possibleBotIds = [
      `${botNumber}@s.whatsapp.net`,
      sock.user.id,
      `${botNumber}@c.us`
    ];
    
    console.log('  Bot number:', botNumber);
    console.log('  Possible bot IDs:', possibleBotIds);
    console.log('  Total participants:', groupMetadata.participants.length);
    
    // Show all participants (helpful for debugging)
    console.log('  All participants:');
    groupMetadata.participants.forEach((p, index) => {
      console.log(`    ${index + 1}. ${p.id} - Admin: ${p.admin || 'none'}`);
    });
    
    const participant = groupMetadata.participants.find(p => 
      possibleBotIds.includes(p.id)
    );
    
    if (!participant) {
      console.log('  ❌ Bot not found in participants!');
      console.log('  ⚠️ This means the bot ID format is different');
      return false;
    }
    
    console.log('  ✅ Bot participant found:', {
      id: participant.id,
      admin: participant.admin
    });
    
    const isBotAdminUser = participant.admin === 'admin' || participant.admin === 'superadmin';
    console.log('  🤖 Bot is admin:', isBotAdminUser);
    console.log(''); // Empty line for readability
    
    return isBotAdminUser;
  } catch (error) {
    console.error('❌ Error checking bot admin:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

/**
 * Extract mentioned users from message
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

/**
 * Check if user is group admin (alias for isAdmin)
 */
async function isGroupAdmin(sock, groupId, userId) {
  return await isAdmin(sock, groupId, userId);
}

/**
 * Get all group admins
 */
async function getGroupAdmins(sock, groupId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const admins = groupMetadata.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);
    return admins;
  } catch (error) {
    console.error('Error getting group admins:', error);
    return [];
  }
}

module.exports = {
  isAdmin,
  isBotAdmin,
  getMentionedJids,
  getQuotedParticipant,
  isGroupAdmin,
  getGroupAdmins
};