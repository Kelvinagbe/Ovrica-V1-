// ============================================
// FILE: utils/session-manager.js
// ============================================
const fs = require('fs');
const path = require('path');
const SESSIONS_DIR = path.join(__dirname, '../sessions');
const USERS_FILE = path.join(SESSIONS_DIR, 'users.json');
function ensureSessionsDir() {
if (!fs.existsSync(SESSIONS_DIR)) {
fs.mkdirSync(SESSIONS_DIR, { recursive: true });
console.log('📁 Created sessions directory');
}
}
function loadUsers() {
try {
if (fs.existsSync(USERS_FILE)) {
const data = fs.readFileSync(USERS_FILE, 'utf8');
return JSON.parse(data);
}
} catch (error) {
console.error('❌ Error loading users:', error.message);
}
return { users: [], totalUsers: 0, lastUpdated: null };
}
function saveUsers(usersData) {
try {
ensureSessionsDir();
usersData.lastUpdated = new Date().toISOString();
fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
return true;
} catch (error) {
console.error('❌ Error saving users:', error.message);
return false;
}
}
function addOrUpdateUser(jid, name, isGroup = false) {
try {
const usersData = loadUsers();
const userNumber = jid.split('@')[0];
const existingUserIndex = usersData.users.findIndex(u => u.jid === jid);
    
    const userData = {
        jid: jid,
        number: userNumber,
        name: name || 'Unknown',
        isGroup: isGroup,
        firstSeen: existingUserIndex === -1 ? new Date().toISOString() : usersData.users[existingUserIndex].firstSeen,
        lastSeen: new Date().toISOString(),
        messageCount: existingUserIndex === -1 ? 1 : (usersData.users[existingUserIndex].messageCount || 0) + 1
    };
    
    if (existingUserIndex === -1) {
        usersData.users.push(userData);
        usersData.totalUsers = usersData.users.length;
        saveUsers(usersData);
        console.log(`👤 New user: ${name} (${userNumber})`);
        return { isNew: true, userData };
    } else {
        usersData.users[existingUserIndex] = userData;
        saveUsers(usersData);
        return { isNew: false, userData };
    }
} catch (error) {
    console.error('❌ Error adding/updating user:', error.message);
    return null;
}
}
function getUserStats() {
try {
const usersData = loadUsers();
const users = usersData.users || [];
return {
        total: users.length,
        groups: users.filter(u => u.isGroup).length,
        privateChats: users.filter(u => !u.isGroup).length,
        totalMessages: users.reduce((sum, u) => sum + (u.messageCount || 0), 0)
    };
} catch (error) {
    console.error('❌ Error getting user stats:', error.message);
    return { total: 0, groups: 0, privateChats: 0, totalMessages: 0 };
}
}
module.exports = {
ensureSessionsDir,
loadUsers,
saveUsers,
addOrUpdateUser,
getUserStats
};