// FILE: utils/helpers.js
// COMPLETE REWRITE - Fixed for @lid, @s.whatsapp.net, and all JID formats
// Supports WhatsApp Multi-Device (MD) with LID (Lidded ID) format

// ============================================
// ✅ GET CLEAN NUMBER - Extract digits only
// ============================================
function getCleanNumber(jid) {
    try {
        if (!jid) return null;

        // Convert to string in case it's a number
        const jidStr = String(jid);

        // Handle different JID formats:
        // - 2348109860102@s.whatsapp.net (normal)
        // - 2348109860102:12@s.whatsapp.net (multi-device)
        // - 267607148122138@lid (linked device ID - NEW)
        // - 2348109860102@c.us (legacy format)
        // - 2348109860102@g.us (group - not a user)
        // - 2348109860102 (plain number)

        // Split by @ to remove domain
        // Split by : to remove device ID
        // Remove all non-digits
        const cleaned = jidStr
            .split('@')[0]     // Remove @s.whatsapp.net, @lid, @g.us, @c.us
            .split(':')[0]     // Remove :12 device ID
            .replace(/\D/g, ''); // Remove all non-digits (letters, symbols)

        return cleaned || null;

    } catch (error) {
        console.error('❌ getCleanNumber error:', error.message);
        return null;
    }
}

// ============================================
// ✅ ADMIN CHECK - Supports all number formats
// ============================================
function isAdmin(jid, adminList) {
    try {
        if (!jid || !adminList || !Array.isArray(adminList) || adminList.length === 0) {
            return false;
        }

        // Extract clean number from JID
        const userNumber = getCleanNumber(jid);

        if (!userNumber) {
            console.log('⚠️  Could not extract number from JID:', jid);
            return false;
        }

        // Check against admin list with flexible matching
        const isAdminUser = adminList.some(admin => {
            const adminNumber = getCleanNumber(admin);

            if (!adminNumber) return false;

            // Primary: Exact match
            if (userNumber === adminNumber) return true;

            // Fallback: Last 10 digits match (for country code variations)
            if (userNumber.length >= 10 && adminNumber.length >= 10) {
                const userLast10 = userNumber.slice(-10);
                const adminLast10 = adminNumber.slice(-10);
                return userLast10 === adminLast10;
            }

            return false;
        });

        // Debug logging (only for matches to reduce spam)
        if (isAdminUser) {
            console.log(`✅ Admin verified: ${jid} → ${userNumber}`);
        }

        return isAdminUser;

    } catch (error) {
        console.error('❌ isAdmin error:', error.message);
        return false;
    }
}

// ============================================
// ✅ GET USER NAME - Extract display name
// ============================================
function getUserName(msg) {
    try {
        // Try multiple sources for user name
        return msg?.pushName || 
               msg?.verifiedBizName || 
               msg?.key?.pushName || 
               msg?.notify ||
               'User';
    } catch (error) {
        return 'User';
    }
}

// ============================================
// ✅ FORMAT JID - Ensure proper WhatsApp JID format
// ============================================
function formatJid(number) {
    try {
        if (!number) return null;

        const cleaned = getCleanNumber(number);
        if (!cleaned) return null;

        // If already has @s.whatsapp.net, return as is
        if (String(number).includes('@s.whatsapp.net')) {
            return number;
        }

        // If has @lid, keep it (don't convert)
        if (String(number).includes('@lid')) {
            return number;
        }

        // Add @s.whatsapp.net for plain numbers
        return `${cleaned}@s.whatsapp.net`;

    } catch (error) {
        return null;
    }
}

// ============================================
// ✅ IS GROUP - Check if JID is a group
// ============================================
function isGroup(jid) {
    try {
        return jid && String(jid).endsWith('@g.us');
    } catch {
        return false;
    }
}

// ============================================
// ✅ GET SENDER - Extract actual sender from message
// ============================================
function getSender(msg) {
    try {
        const from = msg.key?.remoteJid;
        if (!from) return null;

        // In groups, use participant or participantPn (handles @lid)
        // In DMs, use remoteJid
        if (isGroup(from)) {
            // prioritize participantPn if available (fixes @lid issue)
            return msg.key.participantPn || msg.key.participant || from;
        } else {
            return from;
        }

    } catch {
        return null;
    }
}

// ============================================
// ✅ PARSE MENTIONS - Extract mentioned users
// ============================================
function parseMentions(text) {
    try {
        if (!text) return [];

        // Match @1234567890 pattern
        const matches = text.match(/@(\d+)/g);
        if (!matches) return [];

        // Convert to JID format
        return matches.map(match => {
            const number = match.replace('@', '');
            return `${number}@s.whatsapp.net`;
        });

    } catch {
        return [];
    }
}

// ============================================
// ✅ IS OWNER - Check if user is the bot owner
// ============================================
function isOwner(jid, ownerNumber) {
    try {
        if (!jid || !ownerNumber) return false;

        const userNumber = getCleanNumber(jid);
        const owner = getCleanNumber(ownerNumber);

        if (!userNumber || !owner) return false;

        // Primary: Exact match
        if (userNumber === owner) return true;

        // Fallback: Last 10 digits match
        if (userNumber.length >= 10 && owner.length >= 10) {
            const userLast10 = userNumber.slice(-10);
            const ownerLast10 = owner.slice(-10);
            return userLast10 === ownerLast10;
        }

        return false;

    } catch {
        return false;
    }
}

// ============================================
// ✅ VALIDATE NUMBER - Check if valid phone number
// ============================================
function isValidNumber(number) {
    try {
        if (!number) return false;

        const cleaned = getCleanNumber(number);

        // Valid phone numbers are typically 7-15 digits
        return cleaned && cleaned.length >= 7 && cleaned.length <= 15;

    } catch {
        return false;
    }
}

// ============================================
// ✅ NORMALIZE JID - Convert @lid to standard format
// ============================================
function normalizeJid(jid) {
    try {
        if (!jid) return null;

        let normalized = String(jid).trim();

        // Convert @lid to @s.whatsapp.net
        if (normalized.endsWith('@lid')) {
            const number = getCleanNumber(normalized);
            return number ? `${number}@s.whatsapp.net` : normalized;
        }

        // Convert @c.us to @s.whatsapp.net (legacy)
        if (normalized.endsWith('@c.us')) {
            const number = getCleanNumber(normalized);
            return number ? `${number}@s.whatsapp.net` : normalized;
        }

        return normalized;

    } catch {
        return jid;
    }
}

// ============================================
// ✅ SLEEP - Async delay helper
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// ✅ RANDOM CHOICE - Pick random item from array
// ============================================
function randomChoice(array) {
    try {
        if (!Array.isArray(array) || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    } catch {
        return null;
    }
}

// ============================================
// ✅ TRUNCATE TEXT - Limit text length
// ============================================
function truncate(text, maxLength = 100) {
    try {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    } catch {
        return '';
    }
}

// ============================================
// ✅ EXTRACT QUOTED MESSAGE
// ============================================
function getQuotedMessage(msg) {
    try {
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (!contextInfo) return null;

        return {
            text: contextInfo.quotedMessage?.conversation || 
                  contextInfo.quotedMessage?.extendedTextMessage?.text || '',
            sender: contextInfo.participant,
            messageId: contextInfo.stanzaId
        };
    } catch {
        return null;
    }
}

// ============================================
// ✅ IS SAME USER - Compare two JIDs
// ============================================
function isSameUser(jid1, jid2) {
    try {
        if (!jid1 || !jid2) return false;

        const num1 = getCleanNumber(jid1);
        const num2 = getCleanNumber(jid2);

        if (!num1 || !num2) return false;

        // Exact match
        if (num1 === num2) return true;

        // Last 10 digits match
        if (num1.length >= 10 && num2.length >= 10) {
            return num1.slice(-10) === num2.slice(-10);
        }

        return false;

    } catch {
        return false;
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = { 
    // Core functions
    isAdmin,
    getCleanNumber,
    getUserName,
    getSender,

    // JID utilities
    formatJid,
    normalizeJid,
    isGroup,
    isSameUser,
    
    // Validation
    isOwner,
    isValidNumber,

    // Message utilities
    parseMentions,
    getQuotedMessage,

    // Helper functions
    sleep,
    randomChoice,
    truncate
};