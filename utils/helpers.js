// FILE: utils/helpers.js
// COMPLETE REWRITE - Fixed admin detection for all JID formats

// ============================================
// ✅ ADMIN CHECK - Supports all number formats
// ============================================
function isAdmin(jid, adminList) {
    try {
        if (!jid || !adminList || !Array.isArray(adminList) || adminList.length === 0) {
            return false;
        }

        // Extract clean number from JID
        // Handles: 
        // - 1234567890@s.whatsapp.net
        // - 1234567890:12@s.whatsapp.net
        // - 1234567890
        const userNumber = getCleanNumber(jid);

        if (!userNumber) {
            console.log('⚠️  Could not extract number from JID:', jid);
            return false;
        }

        // Check against admin list
        const isAdminUser = adminList.some(admin => {
            // Extract clean number from admin entry
            const adminNumber = getCleanNumber(admin);
            
            // Compare clean numbers
            const match = userNumber === adminNumber;
            
            // Debug logging (only for matches to reduce spam)
            if (match) {
                console.log(`✅ Admin match found:`);
                console.log(`   User: ${jid} → ${userNumber}`);
                console.log(`   Admin: ${admin} → ${adminNumber}`);
            }
            
            return match;
        });

        return isAdminUser;

    } catch (error) {
        console.error('❌ isAdmin error:', error.message);
        return false;
    }
}

// ============================================
// ✅ GET CLEAN NUMBER - Extract digits only
// ============================================
function getCleanNumber(jid) {
    try {
        if (!jid) return null;
        
        // Convert to string in case it's a number
        const jidStr = String(jid);
        
        // Split by @ to remove domain (@s.whatsapp.net, @g.us)
        // Split by : to remove device ID (:12, :0)
        // Remove all non-digits
        const cleaned = jidStr
            .split('@')[0]     // Remove @s.whatsapp.net
            .split(':')[0]     // Remove :12 device ID
            .replace(/\D/g, ''); // Remove all non-digits
        
        return cleaned || null;
        
    } catch (error) {
        console.error('❌ getCleanNumber error:', error.message);
        return null;
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
        
        // Add @s.whatsapp.net
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
        
        // In groups, use participant. In DMs, use remoteJid
        const sender = isGroup(from) 
            ? (msg.key.participant || from)
            : from;
            
        return sender;
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
        
        return userNumber === owner;
        
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
// EXPORTS
// ============================================
module.exports = { 
    // Core functions
    isAdmin,
    getCleanNumber,
    getUserName,
    
    // Utility functions
    formatJid,
    isGroup,
    getSender,
    parseMentions,
    isOwner,
    isValidNumber,
    
    // Helper functions
    sleep,
    randomChoice,
    truncate,
    getQuotedMessage
};