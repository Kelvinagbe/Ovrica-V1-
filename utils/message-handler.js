// FILE: utils/message-handler.js
// ============================================
const { addOrUpdateUser } = require('./session-manager');
const { isAdmin, getUserName } = require('./helpers');

// Import state from index
let welcomedUsers, statusViewed;
try {
    const state = require('../index');
    welcomedUsers = state.welcomedUsers || new Set();
    statusViewed = state.statusViewed || new Set();
} catch (error) {
    welcomedUsers = new Set();
    statusViewed = new Set();
}

// ============================================
// MAIN MESSAGE HANDLER
// ============================================
async function handleMessage(messages, sock, CONFIG, commands) {
    try {
        const msg = messages[0];
        if (!msg?.message) return;

        const from = msg.key?.remoteJid;
        if (!from) return;

        // Handle status broadcasts
        if (from === 'status@broadcast') {
            if (CONFIG.autoViewStatus) {
                await handleStatusView(sock, msg, CONFIG);
            }
            return;
        }

        // Extract sender information
        const sender = from.endsWith('@g.us') 
            ? (msg.key.participant || from) 
            : from;
        
        if (!sender) return;

        const isOwner = msg.key.fromMe === true;
        const isGroup = from.endsWith('@g.us');
        const userName = getUserName(msg);
        const admin = isAdmin(sender, CONFIG.admins);

        // Save user session (excluding owner)
        if (!isOwner) {
            addOrUpdateUser(from, userName, isGroup);
        }

        // Extract message text
        const text = extractMessageText(msg);

        // Check for txt2img session response
        if (await handleTxt2ImgSession(sock, from, msg, text, userName)) {
            return;
        }

        // Determine if this is a command
        const isCommand = text && (text.startsWith('/') || text.startsWith('!'));

        // Log owner commands
        if (isOwner && isCommand) {
            console.log(`👑 Owner: ${text.substring(0, 50)}`);
        } else if (isOwner) {
            return; // Ignore non-command owner messages
        }

        // Private mode enforcement
        if (CONFIG.botMode === 'private' && !admin && !isOwner && isCommand) {
            console.log(`🔒 Blocked: ${userName}`);
            return;
        }

        // Send welcome message (first time users)
        if (shouldSendWelcome(CONFIG, admin, isGroup, from, isOwner)) {
            await sendWelcomeMessage(sock, from, userName, CONFIG);
        }

        // Auto-react to messages
        if (shouldAutoReact(CONFIG, admin, isOwner)) {
            await autoReactToMessage(sock, from, msg, CONFIG);
        }

        // Execute command
        if (isCommand && text) {
            await executeCommand(sock, from, text, msg, admin, isOwner, CONFIG, commands);
        }

    } catch (error) {
        if (CONFIG.logErrors) {
            console.error('❌ Message handler error:', error.message);
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract text from various message types
 */
function extractMessageText(msg) {
    try {
        return msg.message?.conversation || 
               msg.message?.extendedTextMessage?.text || 
               msg.message?.imageMessage?.caption || 
               msg.message?.videoMessage?.caption || 
               msg.message?.documentMessage?.caption ||
               '';
    } catch {
        return '';
    }
}

/**
 * Handle status view and reaction
 */
async function handleStatusView(sock, msg, CONFIG) {
    try {
        await sock.readMessages([msg.key]);

        if (CONFIG.autoReact && CONFIG.reactEmojis?.length > 0) {
            const emoji = CONFIG.reactEmojis[
                Math.floor(Math.random() * CONFIG.reactEmojis.length)
            ];
            
            await sock.sendMessage('status@broadcast', {
                react: { text: emoji, key: msg.key }
            }).catch(() => {});
        }

        if (msg.key.participant) {
            statusViewed.add(msg.key.participant);
        }

        console.log('✅ Status viewed');
    } catch (error) {
        // Silent fail
    }
}

/**
 * Handle txt2img session (style selection)
 */
async function handleTxt2ImgSession(sock, from, msg, text, userName) {
    try {
        const txt2img = require('../commands/txt2img');
        
        if (!txt2img?.userSessions) return false;

        const session = txt2img.userSessions.get(from);
        
        if (session && /^[1-5]$/.test(text.trim())) {
            console.log(`🎨 txt2img style ${text.trim()} from ${userName}`);
            
            txt2img.userSessions.delete(from);
            
            if (txt2img.generateImage) {
                await txt2img.generateImage(sock, from, msg, session.prompt, text.trim());
            }
            
            return true;
        }
    } catch (error) {
        // Silent fail
    }
    
    return false;
}

/**
 * Check if welcome message should be sent
 */
function shouldSendWelcome(CONFIG, admin, isGroup, from, isOwner) {
    return (CONFIG.botMode === 'public' || admin) && 
           !isGroup && 
           !welcomedUsers.has(from) && 
           !isOwner;
}

/**
 * Send welcome message to new user
 */
async function sendWelcomeMessage(sock, jid, userName, CONFIG) {
    welcomedUsers.add(jid);
    
    try {
        const welcomeText = 
            `┌ ❏ *⌜ WELCOME ⌟* ❏\n│\n` +
            `├◆ 👋 Hello ${userName}!\n` +
            `├◆ 🤖 I'm ${CONFIG.botName}\n` +
            `├◆ ✨ Type /menu to get started\n│\n` +
            `└ ❏\n> 🎭${CONFIG.botName}🎭`;
        
        await sock.sendMessage(jid, { text: welcomeText });
    } catch (error) {
        // Silent fail
    }
}

/**
 * Check if message should get auto-react
 */
function shouldAutoReact(CONFIG, admin, isOwner) {
    return (CONFIG.botMode === 'public' || admin) && 
           CONFIG.autoReact && 
           Math.random() < 0.3 && 
           !isOwner;
}

/**
 * Auto-react to message
 */
async function autoReactToMessage(sock, from, msg, CONFIG) {
    try {
        if (CONFIG.reactEmojis?.length > 0) {
            const emoji = CONFIG.reactEmojis[
                Math.floor(Math.random() * CONFIG.reactEmojis.length)
            ];
            
            await sock.sendMessage(from, {
                react: { text: emoji, key: msg.key }
            }).catch(() => {});
        }
    } catch (error) {
        // Silent fail
    }
}

/**
 * Execute bot command with permission checks
 */
async function executeCommand(sock, from, text, msg, admin, isOwner, CONFIG, commands) {
    try {
        const parts = text.trim().split(/\s+/);
        const command = parts[0].toLowerCase().replace(/^[!/]/, '');
        const args = parts.slice(1);

        if (!commands[command]) return;

        // ============================================
        // OWNER PERMISSION CHECK
        // ============================================
        if (commands[command].owner && !isOwner) {
            const deniedText = 
                `┌ ❏ *⌜ OWNER ONLY ⌟* ❏\n│\n` +
                `├◆ 👑 Restricted to bot owner\n` +
                `├◆ 🔒 Command: /${command}\n` +
                `├◆ ⛔ Access denied\n│\n` +
                `├◆ 💬 Contact: wa.me/${CONFIG.ownerNumber || '2348109860102'}\n│\n` +
                `└ ❏\n> 🎭${CONFIG.botName}🎭`;
            
            await sock.sendMessage(from, {
                text: deniedText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                        newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "👑 Owner Only",
                        body: "Restricted Command",
                        thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                        sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg }).catch(() => {});
            
            console.log(`👑 Blocked owner command from: ${getUserName(msg)}`);
            return;
        }

        // ============================================
        // ADMIN PERMISSION CHECK
        // ============================================
        if (commands[command].admin && !admin && !isOwner) {
            if (CONFIG.botMode === 'public') {
                const deniedText = 
                    `┌ ❏ *⌜ ACCESS DENIED ⌟* ❏\n│\n` +
                    `├◆ ⛔ Admin only command\n` +
                    `├◆ 🔒 Command: /${command}\n` +
                    `├◆ 🚫 Unauthorized access\n│\n` +
                    `├◆ 💬 Contact: wa.me/${CONFIG.ownerNumber || '2348109860102'}\n│\n` +
                    `└ ❏\n> 🎭${CONFIG.botName}🎭`;
                
                await sock.sendMessage(from, {
                    text: deniedText,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: CONFIG.newsletterJid || "120363418958316196@newsletter",
                            newsletterName: CONFIG.newsletterName || "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "🔒 Access Denied",
                            body: "Admin Only Command",
                            thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                            sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg }).catch(() => {});
            }
            console.log(`🔐 Blocked admin command from: ${getUserName(msg)}`);
            return;
        }

        // ============================================
        // EXECUTE COMMAND
        // ============================================
        if (CONFIG.logCommands) {
            const userType = isOwner ? '(Owner)' : (admin ? '(Admin)' : '(User)');
            console.log(`⚡ /${command} ${userType}`);
        }

        await commands[command].exec(sock, from, args, msg, admin || isOwner);

    } catch (error) {
        console.error(`❌ Command error [${command}]:`, error.message);
        
        try {
            const errorText = 
                `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                `├◆ ❌ Command failed\n` +
                `├◆ 🔧 Command: /${command}\n` +
                `├◆ 💥 Error: ${error.message}\n│\n` +
                `├◆ 💡 Try again or contact support\n│\n` +
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
                        title: "❌ Command Error",
                        body: `Failed: /${command}`,
                        thumbnailUrl: CONFIG.thumbnailUrl || "./icon.jpg",
                        sourceUrl: CONFIG.channelUrl || "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg }).catch(() => {});
        } catch {
            // Silent fail
        }
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = { handleMessage };