// utils/helpers/groupHelpers.js - Group helper functions with LID support
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

/**
 * Normalize JID to handle both LID and PN formats
 * @param {string} jid - The JID to normalize (can be LID or PN)
 * @returns {string} - Normalized JID
 */
function normalizeJid(jid) {
  if (!jid) return jid;
  
  // Handle @lid format (new)
  if (jid.includes('@lid')) {
    return jid;
  }
  
  // Handle @s.whatsapp.net format (old PN format)
  if (jid.includes('@s.whatsapp.net')) {
    return jid;
  }
  
  // Handle @c.us format (legacy)
  if (jid.includes('@c.us')) {
    return jid.replace('@c.us', '@s.whatsapp.net');
  }
  
  // If no @ symbol, assume it needs @s.whatsapp.net
  if (!jid.includes('@')) {
    return `${jid}@s.whatsapp.net`;
  }
  
  return jid;
}

/**
 * Get the actual identifier from contact (handles both LID and PN)
 * @param {Object} participant - The participant object from group metadata
 * @returns {string} - The participant's ID (LID or PN)
 */
function getParticipantId(participant) {
  // In Baileys 7.x, the 'id' field is the preferred identifier
  // It can be either a LID or a PN
  return participant.id || participant.jid || participant.lid;
}

/**
 * Check if user is admin in a group (supports LID and PN)
 */
async function isAdmin(sock, groupId, userId) {
  try {
    console.log('🔍 isAdmin - Checking if user is admin...');
    console.log('  Group ID:', groupId);
    console.log('  User ID:', userId);

    const groupMetadata = await sock.groupMetadata(groupId);
    console.log('  Total participants:', groupMetadata.participants.length);

    // Normalize the userId to handle both LID and PN
    const normalizedUserId = normalizeJid(userId);
    console.log('  Normalized User ID:', normalizedUserId);

    // Find participant by checking both id and possible alternates
    const participant = groupMetadata.participants.find(p => {
      const participantId = getParticipantId(p);
      
      // Direct match
      if (participantId === normalizedUserId || participantId === userId) {
        return true;
      }
      
      // Check phoneNumber field (if LID is used as id)
      if (p.phoneNumber && userId.includes(p.phoneNumber)) {
        return true;
      }
      
      // Check lid field (if PN is used as id)
      if (p.lid && (userId === p.lid || normalizedUserId === p.lid)) {
        return true;
      }
      
      return false;
    });

    if (!participant) {
      console.log('  ❌ User not found in group');
      console.log('  Available participants:', groupMetadata.participants.map(p => ({
        id: getParticipantId(p),
        admin: p.admin,
        phoneNumber: p.phoneNumber,
        lid: p.lid
      })));
      return false;
    }

    console.log('  Participant found:', {
      id: getParticipantId(participant),
      admin: participant.admin,
      phoneNumber: participant.phoneNumber,
      lid: participant.lid
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
 * Check if bot is admin in a group (supports LID and PN)
 */
async function isBotAdmin(sock, groupId) {
  try {
    console.log('\n🤖 isBotAdmin - Checking if bot is admin...');
    console.log('  Group ID:', groupId);

    const groupMetadata = await sock.groupMetadata(groupId);

    // Get bot's ID from sock.user
    // In Baileys 7.x, sock.user.id is the preferred identifier (can be LID or PN)
    const botId = sock.user.id;
    const botNumber = botId.split(':')[0].split('@')[0];
    
    console.log('  Bot ID:', botId);
    console.log('  Bot number:', botNumber);
    console.log('  Total participants:', groupMetadata.participants.length);

    // Create all possible bot ID formats
    const possibleBotIds = [
      botId,
      `${botNumber}@s.whatsapp.net`,
      `${botNumber}@lid`,
      `${botNumber}@c.us`,
      sock.user.id
    ];

    console.log('  Possible bot IDs:', possibleBotIds);

    // Log all participants for debugging
    console.log('  All participants:');
    groupMetadata.participants.forEach((p, index) => {
      const participantId = getParticipantId(p);
      console.log(`    ${index + 1}. ${participantId} - Admin: ${p.admin || 'none'} - PN: ${p.phoneNumber || 'none'} - LID: ${p.lid || 'none'}`);
    });

    // Find bot participant with flexible matching
    const participant = groupMetadata.participants.find(p => {
      const participantId = getParticipantId(p);
      
      // Try direct match with all possible IDs
      if (possibleBotIds.some(id => id === participantId)) {
        return true;
      }
      
      // Check phoneNumber field
      if (p.phoneNumber && botNumber.includes(p.phoneNumber)) {
        return true;
      }
      
      // Check if participantId contains bot number
      if (participantId && participantId.includes(botNumber)) {
        return true;
      }
      
      // Check lid field
      if (p.lid && possibleBotIds.includes(p.lid)) {
        return true;
      }
      
      return false;
    });

    if (!participant) {
      console.log('  ❌ Bot not found in participants!');
      console.log('  ⚠️ Bot may not be in the group or ID format has changed');
      return false;
    }

    console.log('  ✅ Bot participant found:', {
      id: getParticipantId(participant),
      admin: participant.admin,
      phoneNumber: participant.phoneNumber,
      lid: participant.lid
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
 * Extract mentioned users from message (supports LID and PN)
 */
function getMentionedJids(msg) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  return mentioned;
}

/**
 * Get quoted message participant (supports LID and PN)
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
 * Get all group admins (supports LID and PN)
 */
async function getGroupAdmins(sock, groupId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const admins = groupMetadata.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => getParticipantId(p));
    return admins;
  } catch (error) {
    console.error('Error getting group admins:', error);
    return [];
  }
}

/**
 * Get LID from phone number (if available in signalRepository)
 * This helps convert old PN format to new LID format
 */
async function getLIDForPN(sock, phoneNumber) {
  try {
    if (!sock.signalRepository || !sock.signalRepository.lidMapping) {
      console.warn('⚠️ LID mapping not available in this Baileys version');
      return null;
    }
    
    const normalizedPN = normalizeJid(phoneNumber);
    const lid = await sock.signalRepository.lidMapping.getLIDForPN(normalizedPN);
    return lid;
  } catch (error) {
    console.error('Error getting LID for PN:', error);
    return null;
  }
}

/**
 * Get Phone Number from LID (if available in signalRepository)
 * This helps convert new LID format back to PN format
 */
async function getPNForLID(sock, lid) {
  try {
    if (!sock.signalRepository || !sock.signalRepository.lidMapping) {
      console.warn('⚠️ LID mapping not available in this Baileys version');
      return null;
    }
    
    const pn = await sock.signalRepository.lidMapping.getPNForLID(lid);
    return pn;
  } catch (error) {
    console.error('Error getting PN for LID:', error);
    return null;
  }
}

/**
 * Get user identifier - tries to get the most reliable ID
 * @param {Object} sock - WhatsApp socket
 * @param {string} jid - The JID (can be LID or PN)
 * @returns {Promise<string>} - The most reliable identifier
 */
async function getUserIdentifier(sock, jid) {
  // If it's already a LID, return it (LIDs are more reliable in v7+)
  if (jid.includes('@lid')) {
    return jid;
  }
  
  // If it's a PN, try to get the LID
  if (jid.includes('@s.whatsapp.net')) {
    const lid = await getLIDForPN(sock, jid);
    return lid || jid; // Fallback to PN if LID not found
  }
  
  return jid;
}

module.exports = {
  isAdmin,
  isBotAdmin,
  getMentionedJids,
  getQuotedParticipant,
  isGroupAdmin,
  getGroupAdmins,
  normalizeJid,
  getParticipantId,
  getLIDForPN,
  getPNForLID,
  getUserIdentifier
};