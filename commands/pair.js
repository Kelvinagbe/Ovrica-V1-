// ============================================
// FILE: commands/pair.js
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

// Store active user sessions
const userSessions = new Map();
const pairingInProgress = new Map();

module.exports = {
    name: 'pair',
    admin: false,
    owner: false,
    description: 'Pair your WhatsApp number to use bot personally',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        const CONFIG = require('../config');
        
        // Check if user already has a session
        const userNumber = from.split('@')[0];
        const sessionPath = path.join(__dirname, '../user_sessions', userNumber);
        
        // Check if pairing is already in progress
        if (pairingInProgress.has(userNumber)) {
            return await sendWithTyping(sock, from, 
                `⏳ Pairing already in progress!\nPlease wait for your code or try again in 60 seconds.`
            );
        }
        
        if (userSessions.has(userNumber)) {
            const statusText = 
                `┌ ❏ *⌜ ALREADY PAIRED ⌟* ❏\n│\n` +
                `├◆ ✅ Your WhatsApp is already connected\n` +
                `├◆ 📱 Session: Active\n` +
                `├◆ 🔗 Number: ${userNumber}\n│\n` +
                `├◆ 💡 Use /unpair to disconnect\n│\n` +
                `└ ❏\n> 🎭${CONFIG.botName}🎭`;
            
            return await sock.sendMessage(from, {
                text: statusText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                        newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "✅ Already Paired",
                        body: "Active Session",
                        thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                        sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });
        }
        
        // Check if pairing code format is provided
        if (args.length === 0) {
            const helpText = 
                `┌ ❏ *⌜ PAIR YOUR WHATSAPP ⌟* ❏\n│\n` +
                `├◆ 📱 Usage: /pair <phone_number>\n` +
                `├◆ 🌍 Include country code (no +)\n│\n` +
                `├◆ 💡 Example:\n` +
                `├◆   /pair 2348109860102\n` +
                `├◆   /pair 14155552671\n│\n` +
                `├◆ ⚡ You'll receive a pairing code\n` +
                `├◆ 📲 Enter it in WhatsApp > Linked Devices\n│\n` +
                `└ ❏\n> 🎭${CONFIG.botName}🎭`;
            
            return await sock.sendMessage(from, {
                text: helpText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                        newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "📱 Pair Your WhatsApp",
                        body: "Connect & Use Bot Personally",
                        thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                        sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });
        }
        
        // Validate phone number
        const phoneNumber = args[0].replace(/[^0-9]/g, '');
        
        if (phoneNumber.length < 10) {
            return await sendWithTyping(sock, from, 
                `❌ Invalid phone number format!\n\n` +
                `💡 Example: /pair 2348109860102`
            );
        }
        
        // Create user session directory
        if (!fs.existsSync(path.join(__dirname, '../user_sessions'))) {
            fs.mkdirSync(path.join(__dirname, '../user_sessions'), { recursive: true });
        }
        
        // Mark pairing as in progress
        pairingInProgress.set(userNumber, true);
        
        // Start pairing process
        const waitingText = 
            `┌ ❏ *⌜ PAIRING IN PROGRESS ⌟* ❏\n│\n` +
            `├◆ ⏳ Requesting pairing code...\n` +
            `├◆ 📱 Number: ${phoneNumber}\n` +
            `├◆ 🔄 Please wait...\n│\n` +
            `└ ❏\n> 🎭${CONFIG.botName}🎭`;
        
        await sock.sendMessage(from, {
            text: waitingText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                    newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                    serverMessageId: 200
                },
                externalAdReply: {
                    title: "⏳ Pairing...",
                    body: "Generating Code",
                    thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                    sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: msg });
        
        try {
            // Create user-specific connection
            await createUserSession(sock, from, phoneNumber, msg, CONFIG, userNumber);
            
        } catch (error) {
            pairingInProgress.delete(userNumber);
            
            const errorText = 
                `┌ ❏ *⌜ PAIRING FAILED ⌟* ❏\n│\n` +
                `├◆ ❌ Failed to generate pairing code\n` +
                `├◆ 💥 Error: ${error.message}\n│\n` +
                `├◆ 💡 Please try again in a few seconds\n│\n` +
                `└ ❏\n> 🎭${CONFIG.botName}🎭`;
            
            await sock.sendMessage(from, {
                text: errorText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                        newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "❌ Pairing Failed",
                        body: "Try Again",
                        thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                        sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });
        }
    }
};

// ============================================
// CREATE USER SESSION
// ============================================
async function createUserSession(mainSock, requestFrom, phoneNumber, originalMsg, CONFIG, userNumber) {
    const sessionPath = path.join(__dirname, '../user_sessions', userNumber);
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    
    const userSock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false
    });
    
    userSock.ev.on('creds.update', saveCreds);
    
    // Request pairing code
    try {
        const code = await userSock.requestPairingCode(phoneNumber);
        
        const codeText = 
            `┌ ❏ *⌜ PAIRING CODE ⌟* ❏\n│\n` +
            `├◆ 🔐 Your Pairing Code:\n│\n` +
            `├◆    ${code}\n│\n` +
            `├◆ 📱 Steps to pair:\n` +
            `├◆   1. Open WhatsApp\n` +
            `├◆   2. Go to Settings > Linked Devices\n` +
            `├◆   3. Tap "Link a Device"\n` +
            `├◆   4. Enter the code above\n│\n` +
            `├◆ ⏰ Code expires in 60 seconds\n│\n` +
            `└ ❏\n> 🎭${CONFIG.botName}🎭`;
        
        await mainSock.sendMessage(requestFrom, {
            text: codeText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                    newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                    serverMessageId: 200
                },
                externalAdReply: {
                    title: `🔐 Code: ${code}`,
                    body: "Enter in WhatsApp Now!",
                    thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                    sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: originalMsg });
        
        // Timeout to clear pairing flag after 90 seconds
        setTimeout(() => {
            pairingInProgress.delete(userNumber);
        }, 90000);
        
        // Handle connection events
        userSock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                pairingInProgress.delete(userNumber);
                userSessions.set(userNumber, userSock);
                
                const successText = 
                    `┌ ❏ *⌜ PAIRING SUCCESS ⌟* ❏\n│\n` +
                    `├◆ ✅ WhatsApp connected successfully!\n` +
                    `├◆ 📱 Number: ${phoneNumber}\n` +
                    `├◆ 🤖 Bot: ${CONFIG.botName}\n│\n` +
                    `├◆ 🎯 You can now:\n` +
                    `├◆   • Use all bot commands\n` +
                    `├◆   • Personal bot access\n` +
                    `├◆   • Private session\n│\n` +
                    `├◆ 💡 Type /menu to start\n│\n` +
                    `└ ❏\n> 🎭${CONFIG.botName}🎭`;
                
                await mainSock.sendMessage(requestFrom, {
                    text: successText,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                            newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "✅ Pairing Complete",
                            body: "Bot Ready to Use!",
                            thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                            sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                });
                
                // Load commands for user session
                const { handleMessage } = require('../utils/message-handler');
                const commands = require('../commands');
                
                userSock.ev.on('messages.upsert', ({ messages }) => 
                    handleMessage(messages, userSock, CONFIG, commands)
                );
                
                console.log(`✅ User ${userNumber} paired successfully`);
            }
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                // Only handle logout, ignore other disconnects during pairing
                if (statusCode === DisconnectReason.loggedOut) {
                    pairingInProgress.delete(userNumber);
                    userSessions.delete(userNumber);
                    
                    try {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                    } catch (error) {
                        // Silent fail
                    }
                    
                    console.log(`👋 User ${userNumber} logged out`);
                } else if (statusCode === 428 || statusCode === 515) {
                    // Bad session during pairing - clear and notify
                    pairingInProgress.delete(userNumber);
                    
                    try {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                    } catch (error) {
                        // Silent fail
                    }
                    
                    await mainSock.sendMessage(requestFrom, {
                        text: `❌ Pairing failed or expired.\n💡 Please try /pair again with your number.`
                    }).catch(() => {});
                }
                // Ignore other connection closes during pairing (timeout, etc)
            }
        });
        
    } catch (error) {
        pairingInProgress.delete(userNumber);
        throw error;
    }
}

// ============================================
// EXPORT USER SESSIONS
// ============================================
module.exports.userSessions = userSessions;