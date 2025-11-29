const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Import modules
const CONFIG = require('./config');
const commands = require('./commands');
const { initializeBot } = require('./utils/bot-manager');
const { handleMessage } = require('./utils/message-handler');
const { handleConnection } = require('./utils/connection-handler');
const statusListener = require('./statusListener');
const antilink = require('./src/cmd/antilink');

// ✅ IMPORT ENERGY SYSTEM
const { initEnergyDB, shutdown } = require('./utils/energy-system');

// ============================================
// GLOBAL STATE - PROPERLY INITIALIZED
// ============================================
const messageQueue = new Map();
const statusViewed = new Set();
const welcomedUsers = new Set();

// Export each individually for proper destructuring
module.exports = { messageQueue, statusViewed, welcomedUsers };

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) 
            },
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.ubuntu('Chrome'),
            markOnlineOnConnect: CONFIG.alwaysOnline,
            getMessage: async (key) => {
                try {
                    return messageQueue.has(key.id) 
                        ? messageQueue.get(key.id).message 
                        : { conversation: '' };
                } catch { 
                    return { conversation: '' }; 
                }
            },
            syncFullHistory: false,
            retryRequestDelayMs: 250,
            maxMsgRetryCount: 3,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 90000,
            keepAliveIntervalMs: 30000,
            generateHighQualityLinkPreview: false
        });

        // Save credentials on update
        sock.ev.on('creds.update', saveCreds);

        // Handle connection updates
        sock.ev.on('connection.update', (update) => {
            handleConnection(update, sock, connectToWhatsApp, CONFIG);

            // Initialize status listener when connected
            if (update.connection === 'open') {
                try {
                    statusListener.initializeStatusListener(sock);
                    console.log('👁️ Status listener initialized and ready');
                } catch (error) {
                    console.error('❌ Failed to initialize status listener:', error.message);
                }
            }
        });

        // ============================================
        // ✅ HANDLE INCOMING MESSAGES WITH ANTILINK
        // ============================================
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;

            // ✅ CHECK ANTILINK FIRST (before command processing)
            try {
                await antilink.handleMessage(sock, msg);
            } catch (error) {
                if (CONFIG.logErrors) {
                    console.error('❌ Antilink error:', error.message);
                }
            }

            // Then handle normal messages/commands
            handleMessage(messages, sock, CONFIG, commands);
        });

    } catch (error) {
        console.error('❌ Connection error:', error.message);
        console.log('⏳ Waiting 10 seconds before reconnecting...\n');
        setTimeout(connectToWhatsApp, 10000);
    }
}

// ============================================
// ERROR HANDLERS
// ============================================
process.on('uncaughtException', (error) => {
    if (CONFIG.logErrors) {
        console.error('⚠️  Uncaught Exception:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
        }
    }
});

process.on('unhandledRejection', (error) => {
    if (CONFIG.logErrors) {
        console.error('⚠️  Unhandled Rejection:', error.message);
    }
});

// ✅ GRACEFUL SHUTDOWN WITH ENERGY SAVE
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    await shutdown(); // Save pending energy writes
    console.log('💾 Session saved');
    console.log('✅ Goodbye!');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n👋 Received SIGTERM signal');
    await shutdown(); // Save pending energy writes
    console.log('💾 Session saved');
    console.log('✅ Goodbye!');
    process.exit(0);
});

// ============================================
// STARTUP WITH ENERGY SYSTEM
// ============================================
async function startBot() {
    // Initialize bot utilities
    initializeBot();
    
    // ✅ Initialize energy system
    await initEnergyDB();

    console.log('📋 Bot Configuration:');
    console.log(`   • Name: ${CONFIG.botName}`);
    console.log(`   • Version: ${CONFIG.version}`);
    console.log(`   • Mode: ${CONFIG.botMode?.toUpperCase() || 'PUBLIC'}`);
    console.log(`   • Admins: ${CONFIG.admins.length}`);
    console.log(`   • Owner: ${CONFIG.ownerNumber || 'Not set'}`);
    console.log(`   • Always Online: ${CONFIG.alwaysOnline ? '✓' : '✗'}`);
    console.log(`   • Auto View Status: ${CONFIG.autoViewStatus ? '✓' : '✗'}`);
    console.log(`   • Auto React: ${CONFIG.autoReact ? '✓' : '✗'}`);
    console.log(`   • Log Commands: ${CONFIG.logCommands ? '✓' : '✗'}`);
    console.log(`   • Log Errors: ${CONFIG.logErrors ? '✓' : '✗'}`);
    console.log(`   • Anti-Link: ✓ Enabled`);
    console.log(`   • Energy System: ✓ Enabled\n`); // ✅ ADDED

    const authPath = path.join(__dirname, 'auth_info_baileys');
    const credsPath = path.join(authPath, 'creds.json');

    if (fs.existsSync(credsPath)) {
        console.log('🔐 Existing session found - reconnecting...\n');
    } else {
        console.log('🆕 No session found - starting fresh...\n');
    }

    // Start WhatsApp connection
    connectToWhatsApp();
}

// ✅ START BOT WITH ENERGY SYSTEM
startBot();