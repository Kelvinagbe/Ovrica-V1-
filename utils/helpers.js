// utils/helpers.js - Fixed admin detection
function isAdmin(jid, adminList) {
    try {
        if (!jid || !adminList || !Array.isArray(adminList) || adminList.length === 0) {
            return false;
        }

        // Extract clean number from JID
        // Handles: 1234567890@s.whatsapp.net, 1234567890:12@s.whatsapp.net, etc.
        const userNumber = jid.split('@')[0].split(':')[0].replace(/\D/g, '');

        if (!userNumber) {
            console.log('⚠️  Could not extract number from JID:', jid);
            return false;
        }

        // Check against admin list
        const isAdminUser = adminList.some(admin => {
            // Handle admin entries in various formats:
            // - "1234567890" (just number)
            // - "1234567890@s.whatsapp.net" (full JID)
            // - "+1234567890" (with country code)
            const adminNumber = String(admin).split('@')[0].split(':')[0].replace(/\D/g, '');
            return userNumber === adminNumber;
        });

        // Only log when there's a match (reduces spam)
        if (isAdminUser) {
            console.log(`✅ Admin verified: ${userNumber}`);
        }

        return isAdminUser;

    } catch (error) {
        console.error('❌ isAdmin error:', error.message);
        return false;
    }
}

function getUserName(msg) {
    try {
        return msg?.pushName || 
               msg?.verifiedBizName || 
               msg?.key?.pushName || 
               'User';
    } catch {
        return 'User';
    }
}

// Helper to extract clean phone number from any JID format
function getCleanNumber(jid) {
    try {
        if (!jid) return null;
        return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
    } catch {
        return null;
    }
}

module.exports = { 
    isAdmin, 
    getUserName,
    getCleanNumber 
};