// ============================================
// FILE: commands/pair.js - COMPLETE FIXED VERSION
// ============================================
const fs = require('fs');
const path = require('path');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');

// Storage for active sessions
const activePairing = new Map();
const userSessions = new Map();

module.exports = {
    name: 'pair',
    description: 'Pair your WhatsApp with the bot',
    
    async exec(sock, from, args, msg) {
        try {
            const userNumber = from.split('@')[0];
            
            // Check if already paired
            if (userSessions.has(userNumber)) {
                return await sock.sendMessage(from, {
                    text: `✅ You're already paired!\n\n📱 Bot is active\n💡 Use /unpair to disconnect`
                }, { quoted: msg });
            }
            
            // Check if pairing in progress
            if (activePairing.has(userNumber)) {
                return await sock.sendMessage(from, {
                    text: `⏳ Pairing already in progress!\n\nPlease wait or use /unpair to cancel.`
                }, { quoted: msg });
            }
            
            // Validate phone number argument
            if (args.length === 0) {
                return await sock.sendMessage(from, {
                    text: 
                        `📱 *WhatsApp Pairing*\n\n` +
                        `Usage: \`/pair <phone_number>\`\n\n` +
                        `Examples:\n` +
                        `• /pair 2348109860102\n` +
                        `• /pair 14155552671\n` +
                        `• /pair 447700900123\n\n` +
                        `⚠️ Include country code (no + symbol)\n` +
                        `⚠️ Use the number you want to link`
                }, { quoted: msg });
            }
            
            // Clean and validate phone number
            const phoneNumber = args[0].replace(/[^0-9]/g, '');
            
            if (phoneNumber.length < 10 || phoneNumber.length > 15) {
                return await sock.sendMessage(from, {
                    text: 
                        `❌ Invalid phone number!\n\n` +
                        `Must be 10-15 digits\n` +
                        `Example: /pair 2348109860102`
                }, { quoted: msg });
            }
            
            // Mark as pairing in progress
            activePairing.set(userNumber, true);
            
            // Notify user
            await sock.sendMessage(from, {
                text: 
                    `⏳ Initializing pairing...\n\n` +
                    `📱 Number: ${phoneNumber}\n` +
                    `🔄 Setting up connection...\n\n` +
                    `This may take 10-20 seconds...`
            }, { quoted: msg });
            
            // Start the pairing process
            await startPairingProcess(sock, from, phoneNumber, userNumber);
            
        } catch (error) {
            console.error('❌ Pair command error:', error.message);
            const userNumber = from.split('@')[0];
            activePairing.delete(userNumber);
            
            await sock.sendMessage(from, {
                text: 
                    `❌ Pairing failed!\n\n` +
                    `Error: ${error.message}\n\n` +
                    `Please try again in 30 seconds.`
            }, { quoted: msg });
        }
    }
};

// ============================================
// MAIN PAIRING FUNCTION
// ============================================
async function startPairingProcess(mainSock, from, phoneNumber, userNumber) {
    const sessionPath = path.join(__dirname, '../user_sessions', userNumber);
    
    // Ensure base directory exists
    const baseDir = path.join(__dirname, '../user_sessions');
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
        console.log(`📁 Created sessions directory`);
    }
    
    // Clean old session if exists
    if (fs.existsSync(sessionPath)) {
        try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(`🧹 Cleaned old session for ${userNumber}`);
        } catch (e) {
            console.error('⚠️ Cleanup error:', e.message);
        }
    }
    
    // Create fresh session directory
    fs.mkdirSync(sessionPath, { recursive: true });
    console.log(`📂 Session path: ${sessionPath}`);
    
    // Initialize auth state
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    
    console.log(`📡 Baileys version: ${version.join('.')}`);
    
    // Create WhatsApp socket with optimized config
    let userSock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        
        // Pairing optimizations
        syncFullHistory: false,
        markOnlineOnConnect: false,
        fireInitQueries: false,
        emitOwnEvents: false,
        generateHighQualityLinkPreview: false,
        
        // Extended timeouts for pairing
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        qrTimeout: 60000,
        
        // Retry configuration
        retryRequestDelayMs: 350,
        maxMsgRetryCount: 5,
        
        // Keep alive
        keepAliveIntervalMs: 25000,
        
        getMessage: async () => undefined,
        
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        }
    });
    
    // Save credentials on update
    userSock.ev.on('creds.update', saveCreds);
    
    // Connection state tracking
    let codeReceived = false;
    let connectionEstablished = false;
    let shouldReconnect = true;
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 3;
    
    // ============================================
    // CONNECTION EVENT HANDLER
    // ============================================
    const handleConnection = async (update) => {
        const { connection, lastDisconnect, isNewLogin } = update;
        
        console.log(`📡 [${userNumber}] Connection: ${connection || 'null'}`, isNewLogin ? '(New Login)' : '');
        
        // Connecting state
        if (connection === 'connecting') {
            console.log(`🔄 [${userNumber}] Connecting... (Attempt ${reconnectAttempts + 1}/${MAX_RECONNECT})`);
        }
        
        // Successfully connected
        if (connection === 'open') {
            connectionEstablished = true;
            shouldReconnect = false;
            activePairing.delete(userNumber);
            
            // Store session
            userSessions.set(userNumber, {
                sock: userSock,
                phone: phoneNumber,
                created: Date.now()
            });
            
            console.log(`✅ [${userNumber}] Connected successfully! Total sessions: ${userSessions.size}`);
            
            // Wait for WhatsApp to stabilize
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Notify user of success
            await mainSock.sendMessage(from, {
                text: 
                    `✅ *Pairing Successful!*\n\n` +
                    `📱 Phone: ${phoneNumber}\n` +
                    `🤖 Bot Status: Active\n` +
                    `👥 Active Sessions: ${userSessions.size}\n` +
                    `⏰ Connected: ${new Date().toLocaleTimeString()}\n\n` +
                    `🎉 You're all set! Type /menu to see available commands.`
            });
            
            // Setup message handler for this session
            try {
                const { handleMessage } = require('../utils/message-handler');
                const commands = require('../commands');
                const CONFIG = require('../config');
                
                userSock.ev.on('messages.upsert', ({ messages }) => {
                    handleMessage(messages, userSock, CONFIG, commands);
                });
                
                console.log(`📨 [${userNumber}] Message handler ready`);
            } catch (e) {
                console.error(`⚠️ [${userNumber}] Handler setup error:`, e.message);
            }
        }
        
        // Connection closed
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.message || 'Unknown error';
            
            console.log(`🔌 [${userNumber}] Connection closed - Code: ${code}, Reason: ${reason}`);
            
            // Stream error during pairing - RETRY
            const shouldRetry = 
                codeReceived && 
                !connectionEstablished && 
                shouldReconnect && 
                reconnectAttempts < MAX_RECONNECT &&
                (code === 515 || code === 503 || code === 500 || code === DisconnectReason.connectionClosed);
            
            if (shouldRetry) {
                reconnectAttempts++;
                console.log(`🔄 [${userNumber}] Retrying connection... (${reconnectAttempts}/${MAX_RECONNECT})`);
                
                await mainSock.sendMessage(from, {
                    text: 
                        `🔄 Connection interrupted\n\n` +
                        `Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT})\n` +
                        `Please wait, don't close WhatsApp...`
                }).catch(() => {});
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Reconnect with same auth state
                try {
                    const { state: newState, saveCreds: newSaveCreds } = await useMultiFileAuthState(sessionPath);
                    const { version: newVersion } = await fetchLatestBaileysVersion();
                    
                    userSock = makeWASocket({
                        version: newVersion,
                        auth: {
                            creds: newState.creds,
                            keys: makeCacheableSignalKeyStore(newState.keys, pino({ level: 'silent' }))
                        },
                        printQRInTerminal: false,
                        logger: pino({ level: 'silent' }),
                        browser: Browsers.ubuntu('Chrome'),
                        syncFullHistory: false,
                        markOnlineOnConnect: false,
                        fireInitQueries: false,
                        emitOwnEvents: false,
                        connectTimeoutMs: 60000,
                        defaultQueryTimeoutMs: 60000,
                        retryRequestDelayMs: 350,
                        maxMsgRetryCount: 5,
                        keepAliveIntervalMs: 25000,
                        getMessage: async () => undefined
                    });
                    
                    userSock.ev.on('creds.update', newSaveCreds);
                    userSock.ev.on('connection.update', handleConnection);
                    
                    console.log(`🔄 [${userNumber}] Reconnection initiated`);
                    return;
                    
                } catch (reconnectError) {
                    console.error(`❌ [${userNumber}] Reconnect failed:`, reconnectError.message);
                }
            }
            
            // Fatal errors or max retries reached
            const isFatal = 
                reconnectAttempts >= MAX_RECONNECT || 
                code === DisconnectReason.loggedOut || 
                code === 401 || 
                code === 428 ||
                code === 403;
            
            if (isFatal) {
                activePairing.delete(userNumber);
                userSessions.delete(userNumber);
                shouldReconnect = false;
                
                // Clean up session files
                try {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                    console.log(`🧹 [${userNumber}] Session cleaned up`);
                } catch {}
                
                console.log(`❌ [${userNumber}] Pairing failed permanently`);
                
                // Notify user of failure
                try {
                    let errorMsg = `❌ *Pairing Failed*\n\n`;
                    
                    if (reconnectAttempts >= MAX_RECONNECT) {
                        errorMsg += 
                            `Maximum retry attempts reached (${MAX_RECONNECT})\n\n` +
                            `Possible causes:\n` +
                            `• Slow internet connection\n` +
                            `• WhatsApp server issues\n` +
                            `• Phone number blocked temporarily\n\n`;
                    } else if (code === 401 || code === 403) {
                        errorMsg += 
                            `Authentication failed\n\n` +
                            `Make sure you:\n` +
                            `• Entered the correct code\n` +
                            `• Used the right phone number\n` +
                            `• Didn't cancel in WhatsApp\n\n`;
                    } else {
                        errorMsg += 
                            `Error Code: ${code}\n` +
                            `Reason: ${reason}\n\n`;
                    }
                    
                    errorMsg += 
                        `💡 Solutions:\n` +
                        `• Wait 1 minute and try /pair again\n` +
                        `• Check your internet connection\n` +
                        `• Make sure WhatsApp is updated\n` +
                        `• Try restarting your phone\n\n` +
                        `Use /pair <number> to try again`;
                    
                    await mainSock.sendMessage(from, { text: errorMsg });
                } catch (notifyError) {
                    console.error(`⚠️ [${userNumber}] Failed to notify user:`, notifyError.message);
                }
            }
        }
    };
    
    // Attach connection handler
    userSock.ev.on('connection.update', handleConnection);
    
    // Wait for socket to be fully ready
    console.log(`⏳ [${userNumber}] Waiting for socket initialization...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify socket state
    try {
        if (userSock.ws && (userSock.ws.readyState === userSock.ws.OPEN || userSock.ws.readyState === userSock.ws.CONNECTING)) {
            console.log(`✅ [${userNumber}] Socket ready, requesting pairing code...`);
        } else {
            throw new Error('Socket not ready');
        }
    } catch (wsError) {
        console.warn(`⚠️ [${userNumber}] Socket state check failed, proceeding anyway...`);
    }
    
    // ============================================
    // REQUEST PAIRING CODE
    // ============================================
    try {
        console.log(`📤 [${userNumber}] Requesting pairing code for ${phoneNumber}...`);
        
        const code = await userSock.requestPairingCode(phoneNumber);
        codeReceived = true;
        
        console.log(`✅ [${userNumber}] Pairing code generated: ${code}`);
        
        // Send formatted code to user
        await mainSock.sendMessage(from, {
            text: 
                `🔐 *Your Pairing Code*\n\n` +
                `╔══════════════╗\n` +
                `║    ${code}    ║\n` +
                `╚══════════════╝\n\n` +
                `📱 *Steps to Link:*\n` +
                `1️⃣ Open WhatsApp on your phone\n` +
                `2️⃣ Go to Settings ⚙️\n` +
                `3️⃣ Tap "Linked Devices"\n` +
                `4️⃣ Tap "Link a Device"\n` +
                `5️⃣ Select "Link with phone number instead"\n` +
                `6️⃣ Enter this code: *${code}*\n\n` +
                `⏰ Code expires in: 60 seconds\n` +
                `🔄 Connection may take 10-30 seconds after entering code\n` +
                `⚠️ Keep WhatsApp open until connected`
        });
        
        // Send plain code for easy copying
        await new Promise(resolve => setTimeout(resolve, 500));
        await mainSock.sendMessage(from, { text: code });
        
        // Helpful reminder after 15 seconds
        setTimeout(async () => {
            if (!connectionEstablished && activePairing.has(userNumber)) {
                await mainSock.sendMessage(from, {
                    text: 
                        `⏳ *Still Waiting...*\n\n` +
                        `Make sure you:\n` +
                        `✅ Entered the code: ${code}\n` +
                        `✅ Tapped the Link/Connect button\n` +
                        `✅ Have stable internet\n` +
                        `✅ WhatsApp app is open\n\n` +
                        `💡 It can take 10-30 seconds after entering the code`
                }).catch(() => {});
            }
        }, 15000);
        
        // Warning at 45 seconds
        setTimeout(async () => {
            if (!connectionEstablished && activePairing.has(userNumber)) {
                await mainSock.sendMessage(from, {
                    text: 
                        `⚠️ *Code Expiring Soon*\n\n` +
                        `15 seconds left!\n\n` +
                        `If you entered the code, please wait.\n` +
                        `If not, you'll need to use /pair again.`
                }).catch(() => {});
            }
        }, 45000);
        
        // Timeout after 2 minutes
        setTimeout(() => {
            if (activePairing.has(userNumber) && !connectionEstablished) {
                activePairing.delete(userNumber);
                shouldReconnect = false;
                
                console.log(`⏰ [${userNumber}] Pairing timeout after 2 minutes`);
                
                if (!userSessions.has(userNumber)) {
                    try {
                        userSock.end();
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                    } catch {}
                    
                    mainSock.sendMessage(from, {
                        text: 
                            `⏰ *Pairing Timeout*\n\n` +
                            `The pairing code has expired.\n\n` +
                            `Use /pair <number> to get a new code.`
                    }).catch(() => {});
                }
            }
        }, 120000);
        
    } catch (codeError) {
        activePairing.delete(userNumber);
        shouldReconnect = false;
        
        console.error(`❌ [${userNumber}] Failed to generate pairing code:`, codeError.message);
        
        // Clean up
        try {
            userSock.end();
            fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch {}
        
        throw new Error(`Failed to generate pairing code: ${codeError.message}`);
    }
}

// ===========================