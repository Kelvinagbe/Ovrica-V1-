// ============================================
// FILE: utils/helpers.js
// ============================================
function isAdmin(jid, adminList) {
try {
if (!jid) return false;
const number = jid.split('@')[0].replace(/[^0-9]/g, '');
return adminList.includes(number);
} catch {
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