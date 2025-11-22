const { ensureSessionsDir } = require('./session-manager');
function initializeBot() {
console.clear();
console.log('╔════════════════════════════╗');
console.log('║  🚀 WhatsApp Bot v2.1     ║');
console.log('║  👑 Admin System          ║');
console.log('║  🔒 Private/Public Mode   ║');
console.log('║  💾 Session Management    ║');
console.log('╚════════════════════════════╝\n');
ensureSessionsDir();
}
module.exports = { initializeBot };