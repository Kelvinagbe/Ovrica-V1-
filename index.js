// index.js - PERFORMANCE OPTIMIZED
require('module-alias/register');
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
const CONFIG = require('@/config');
const commands = require('@/src/commands');
const { initializeBot } = require('@/utils/bot-manager');
const { handleMessage } = require('@/utils/message-handler');
const { handleConnection } = require('@/utils/connection-handler');
const statusListener = require('@/statusListener');
const antilink = require('@/src/cmd/antilink');
const { handleGroupParticipants } = require('@/utils/handlers/groupevent');
const { initEnergyDB, shutdown } = require('@/utils/energy-system');

// ============================================
// GLOBAL STATE - PROPERLY INITIALIZED
// ============================================
const messageQueue = new Map();
const statusViewed = new Set();
const welcomedUsers = new Set();

module.exports = { messageQueue, statusViewed, welcomedUsers };

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================
// Message throttling to prevent overload
const MESSAGE_THROTTLE = 100; // ms between messages
let lastMessageTime = 0;

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
            
            // ✅ OPTIMIZED getMessage
            getMessage: async (key) => {
                const cached = messageQueue.get(key.id);
                return cached?.message || { conversation: '' };
            },

            // ✅ PERFORMANCE TUNING
            syncFullHistory: false,
            retryRequestDelayMs: 250,
            maxMsgRetryCount: 2, // Reduced from 3
            defaultQueryTimeoutMs: 45000, // Reduced from 60s
            connectTimeoutMs: 60000, // Reduced from 90s
            keepAliveIntervalMs: 25000, // Reduced from 30s
            generateHighQualityLinkPreview: false,
            
            // ✅ ADDITIONAL PERFORMANCE OPTIONS
            shouldIgnoreJid: () => false,
            shouldSyncHistoryMessage: () => false,
            cachedGroupMetadata: async () => null
        });

        // Save credentials on update
        sock.ev.on('creds.update', saveCreds);

        // Handle connection updates
        sock.ev.on('connection.update', (update) => {
            handleConnection(update, sock, connectToWhatsApp, CONFIG);

            // Initialize status listener when connected
            if (update.connection === 'open') {
                // Lazy initialization (non-blocking)
                setImmediate(() => {
                    try {
                        statusListener.initializeStatusListener(sock);
                        console.log('👁️ Status listener initialized');
                    } catch (error) {
                        if (CONFIG.logErrors) {
                            console.error('❌ Status listener error:', error.message);
                        }
                    }
                });
            }
        });

        // ============================================
        // ✅ OPTIMIZED GROUP EVENTS
        // ============================================
        sock.ev.on('group-participants.update', (update) => {
            // Non-blocking execution
            setImmediate(() => {
                handleGroupParticipants(sock, update).catch(err => {
                    if (CONFIG.logErrors) {
                        console.error('❌ Group event error:', err.message);
                    }
                });
            });
        });

        // ============================================
        // ✅ ULTRA-FAST MESSAGE HANDLING
        // ============================================
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const now = Date.now();
            
            // Throttle message processing
            if (now - lastMessageTime < MESSAGE_THROTTLE) {
                await new Promise(r => setTimeout(r, MESSAGE_THROTTLE));
            }
            lastMessageTime = now;

            const msg = messages[0];
            if (!msg?.message) return;

            // Fast path: Run antilink and message handling in parallel
            Promise.all([
                antilink.handleMessage(sock, msg).catch(() => {}),
                handleMessage(messages, sock, CONFIG, commands)
            ]).catch(error => {
                if (CONFIG.logErrors) {
                    console.error('❌ Processing error:', error.message);
                }
            });
        });

    } catch (error) {
        console.error('❌ Connection error:', error.message);
        console.log('⏳ Reconnecting in 10s...\n');
        setTimeout(connectToWhatsApp, 10000);
    }
}

// ============================================
// OPTIMIZED ERROR HANDLERS
// ============================================
const errorLog = new Set(); // Prevent duplicate error logs
const ERROR_LOG_COOLDOWN = 60000; // 1 minute

function logError(type, error) {
    if (!CONFIG.logErrors) return;
    
    const errorKey = `${type}-${error.message}`;
    if (errorLog.has(errorKey)) return;
    
    console.error(`⚠️  ${type}:`, error.message);
    errorLog.add(errorKey);
    
    // Clean error log periodically
    setTimeout(() => errorLog.delete(errorKey), ERROR_LOG_COOLDOWN);
}

process.on('uncaughtException', (error) => {
    logError('Uncaught Exception', error);
});

process.on('unhandledRejection', (error) => {
    logError('Unhandled Rejection', error);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
async function gracefulShutdown(signal) {
    console.log(`\n👋 Received ${signal} - shutting down...`);
    
    try {
        await shutdown(); // Save energy system
        console.log('💾 Data saved');
    } catch (error) {
        console.error('❌ Shutdown error:', error.message);
    }
    
    console.log('✅ Goodbye!');
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ============================================
// OPTIMIZED STARTUP
// ============================================
async function startBot() {
    console.time('⚡ Bot startup time');
    
    // Initialize in parallel
    await Promise.all([
        initializeBot(),
        initEnergyDB()
    ]);

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
    console.log(`   • Energy System: ✓ Enabled`);
    console.log(`   • Welcome/Goodbye: ✓ Enabled\n`);

    const authPath = path.join(__dirname, 'auth_info_baileys');
    const credsPath = path.join(authPath, 'creds.json');

    if (fs.existsSync(credsPath)) {
        console.log('🔐 Existing session found - reconnecting...\n');
    } else {
        console.log('🆕 No session found - starting fresh...\n');
    }

    console.timeEnd('⚡ Bot startup time');
    
    // Start connection
    connectToWhatsApp();
}

// ✅ START BOT
startBot();