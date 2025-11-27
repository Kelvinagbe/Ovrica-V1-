// utils/connection-handler.js
const { DisconnectReason } = require('@whiskeysockets/baileys');
const readline = require('readline');

let pairRequested = false;
let connectionNotificationSent = false;
let pairingInProgress = false;

/**
 * Request pairing code from WhatsApp
 */
async function requestPairingCode(sock, phoneNumber) {
    try {
        pairingInProgress = true;
        console.log('\n🔄 Requesting pairing code from WhatsApp...\n');
        
        const code = await sock.requestPairingCode(phoneNumber);
        
        // Display in template
        console.log('╔════════════════════════════╗');
        console.log('║   🔐 PAIRING CODE         ║');
        console.log('╠════════════════════════════╣');
        console.log(`║      ${code.padEnd(20)} ║`);
        console.log('╠════════════════════════════╣');
        console.log('║  📱 Open WhatsApp         ║');
        console.log('║  ⚙️  Settings > Linked    ║');
        console.log('║     Devices > Link Device ║');
        console.log('║  ⌨️  Enter code above     ║');
        console.log('║  ⏰ Valid for 60 seconds  ║');
        console.log('╚════════════════════════════╝\n');
        
        // Also send normally
        console.log(`Your Pairing Code: ${code}`);
        console.log(`Phone Number: ${phoneNumber}\n`);
        
        setTimeout(() => {
            if (pairingInProgress) {
                pairingInProgress = false;
                console.log('⏱️  Pairing code expired. Please restart and try again.\n');
            }
        }, 90000);
        
        return code;
    } catch (error) {
        pairingInProgress = false;
        console.error('❌ Failed to request pairing code:', error.message);
        throw error;
    }
}

/**
 * Ask for phone number
 */
function askPhoneNumber() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ 
            input: process.stdin, 
            output: process.stdout 
        });
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 FIRST TIME SETUP - PAIRING CODE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📝 Enter your WhatsApp number');
        console.log('💡 Include country code (e.g., 2348109860102)');
        console.log('💡 Or use format: +234 810 986 0102\n');
        
        rl.question('📱 Phone Number: ', (phone) => {
            rl.close();
            resolve(phone);
        });
    });
}

/**
 * Send notification to admins
 */
async function notifyAdmins(sock, admins, message) {
    for (const admin of admins) {
        try {
            await sock.sendMessage(admin, { text: message });
        } catch (error) {
            // Silently fail
        }
    }
}

/**
 * Main connection handler
 */
async function handleConnection(update, sock, reconnect, CONFIG) {
    const { connection, lastDisconnect, qr } = update;
    
    try {
        // First time setup - request pairing code
        if (!sock.authState.creds.registered && !pairRequested) {
            pairRequested = true;
            
            // Ask for phone number
            const phone = await askPhoneNumber();
            
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            
            if (cleanPhone.length < 10) {
                console.error('\n❌ Invalid phone number format');
                console.error('💡 Example: 2348109860102 (country code + number)');
                console.error('💡 Minimum 10 digits required\n');
                pairingInProgress = false;
                return process.exit(1);
            }
            
            console.log(`\n✅ Valid number: ${cleanPhone}`);
            
            try {
                await requestPairingCode(sock, cleanPhone);
            } catch (error) {
                console.error('❌ Pairing failed:', error.message);
                pairingInProgress = false;
                process.exit(1);
            }
            
            return;
        }
        
        // Handle QR code (fallback)
        if (qr) {
            console.log('\n📱 QR Code received (using pairing code instead)\n');
        }
        
        // Handle disconnection
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || 'Unknown error';
            
            console.log(`\n🔌 Disconnected: ${errorMsg}`);
            console.log(`📊 Status Code: ${statusCode}\n`);
            
            // Notify admins
            const disconnectMsg = `⚠️ *Bot Disconnected*\n\nReason: ${errorMsg}\nTime: ${new Date().toLocaleString()}\n\nAttempting to reconnect...`;
            await notifyAdmins(sock, CONFIG.admins, disconnectMsg).catch(() => {});
            
            // Handle different disconnect reasons
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('👋 Logged out of WhatsApp');
                console.log('⚠️  Delete auth_info_baileys folder and restart\n');
                process.exit(0);
            } else if (statusCode === DisconnectReason.badSession || statusCode === 428 || statusCode === 515) {
                console.log('⚠️  Bad session detected');
                console.log('💡 If this persists, delete auth_info_baileys folder\n');
                console.log('🔄 Reconnecting...\n');
                setTimeout(reconnect, 5000);
            } else if (statusCode === DisconnectReason.connectionLost || statusCode === DisconnectReason.connectionClosed || statusCode === DisconnectReason.timedOut) {
                console.log('🔄 Connection lost, reconnecting...\n');
                setTimeout(reconnect, 5000);
            } else if (statusCode === DisconnectReason.connectionReplaced) {
                console.log('📱 Another device connected');
                console.log('💡 Delete auth_info_baileys to use this device\n');
                process.exit(0);
            } else if (statusCode === DisconnectReason.restartRequired) {
                console.log('🔄 Restart required...\n');
                setTimeout(reconnect, 2000);
            } else if (statusCode === DisconnectReason.forbidden) {
                console.log('🚫 Number is banned from WhatsApp\n');
                process.exit(0);
            } else {
                console.log('🔄 Reconnecting...\n');
                setTimeout(reconnect, 5000);
            }
        }
        
        // Handle successful connection
        else if (connection === 'open') {
            pairingInProgress = false;
            pairRequested = false;
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ CONNECTED TO WHATSAPP');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log(`🤖 Bot Name: ${CONFIG.botName}`);
            console.log(`📦 Version: ${CONFIG.version}`);
            console.log(`🔒 Mode: ${CONFIG.botMode?.toUpperCase() || 'PUBLIC'}`);
            console.log(`👑 Admins: ${CONFIG.admins.length}`);
            console.log(`🌐 Always Online: ${CONFIG.alwaysOnline ? 'Yes' : 'No'}`);
            console.log(`📊 Auto View Status: ${CONFIG.autoViewStatus ? 'Yes' : 'No'}`);
            console.log(`💬 Auto React: ${CONFIG.autoReact ? 'Yes' : 'No'}\n`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🚀 Bot is now online and ready!\n');
            
            // Send connection notification once
            if (!connectionNotificationSent) {
                const connectMsg = `✅ *Bot Connected*\n\n🤖 ${CONFIG.botName}\n📦 Version: ${CONFIG.version}\n⏰ Time: ${new Date().toLocaleString()}\n\nBot is now online! 🚀`;
                await notifyAdmins(sock, CONFIG.admins, connectMsg).catch(() => {});
                connectionNotificationSent = true;
            }
            
            // Set presence
            if (CONFIG.alwaysOnline) {
                sock.sendPresenceUpdate('available').catch(() => {});
                setInterval(() => {
                    sock.sendPresenceUpdate('available').catch(() => {});
                }, 30000);
            }
        }
        
        // Handle connecting state
        else if (connection === 'connecting') {
            if (pairingInProgress) {
                console.log('⏳ Waiting for pairing code entry...');
            } else if (!pairRequested) {
                console.log('🔄 Connecting to WhatsApp...');
            }
        }
        
    } catch (error) {
        console.error('❌ Connection handler error:', error.message);
        if (connection === 'close' && !pairingInProgress) {
            setTimeout(reconnect, 5000);
        }
    }
}

module.exports = { handleConnection };