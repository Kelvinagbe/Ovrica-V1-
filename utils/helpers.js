// utils/helpers.js - Fixed version
function isAdmin(jid, adminList) {
    try {
        if (!jid || !adminList) return false;
        
        // Extract number from user JID (remove @ and everything after, keep only digits)
        const userNumber = jid.split('@')[0].replace(/[^0-9]/g, '');
        
        console.log('🔍 Admin check:');
        console.log('  User JID:', jid);
        console.log('  User number:', userNumber);
        
        // Check if user number matches any admin number
        const isAdminUser = adminList.some(admin => {
            // Extract number from admin entry
            const adminNumber = admin.split('@')[0].replace(/[^0-9]/g, '');
            const match = userNumber === adminNumber;
            
            if (match) {
                console.log(`  ✅ Match: ${userNumber} === ${adminNumber}`);
            }
            
            return match;
        });
        
        console.log('  Result:', isAdminUser ? '✅ IS ADMIN' : '❌ NOT ADMIN');
        return isAdminUser;
        
    } catch (error) {
        console.error('❌ isAdmin error:', error);
        return false;
    }
}

function getUserName(msg) {
    try {
        return msg?.pushName || msg?.verifiedBizName || 'User';
    } catch {
        return 'User';
    }
}

module.exports = { isAdmin, getUserName };