// FILE: utils/message-handler.js
// COMPLETE REWRITE - Fixed @lid issue using participantAlt

const { addOrUpdateUser } = require('./session-manager');
const { isAdmin, getUserName, getCleanNumber, normalizeJid } = require('./helpers');
const chatAI = require('../src/db/chatAI');

// Import protection systems
const antilink = require('../src/cmd/antilink');
const antiswear = require('../src/cmd/antiswear');
const antispam = require('../src/cmd/antispam');

// Import state
let welcomedUsers, statusViewed;
try {
    const state = require('../index');
    welcomedUsers = state.welcomedUsers || new Set();
    statusViewed = state.statusViewed || new Set();
} catch {
    welcomedUsers = new Set();
    statusViewed = new Set();
}

// ============================================
// OWNER DETECTION - Fixed for @lid
// ============================================
function isOwnerMessage(msg, sock, CONFIG) {
    try {
        if (msg.key.fromMe === true) return true;

        const from = msg.key.remoteJid;
        const isGroup = from && from.endsWith('@g.us');

        // Use participantAlt for @lid support
        let sender;
        if (isGroup) {
            sender = msg.key.participantAlt || msg.key.participant;
        } else {
            sender = msg.key.remoteJidAlt || from;
        }

        if (!sender) return false;

        sender = normalizeJid(sender);
        const senderNumber = getCleanNumber(sender);
        const ownerNumber = getCleanNumber(CONFIG.ownerNumber);
        const botNumber = getCleanNumber(sock.user?.id || '');

        // Exact match
        const isOwnerExact = senderNumber && ownerNumber && (senderNumber === ownerNumber);
        const isBotExact = senderNumber && botNumber && (senderNumber === botNumber);

        // Fallback: Last 10 digits
        let isOwnerFallback = false;
        let isBotFallback = false;

        if (!isOwnerExact && senderNumber && ownerNumber && 
            senderNumber.length >= 10 && ownerNumber.length >= 10) {
            isOwnerFallback = senderNumber.slice(-10) === ownerNumber.slice(-10);
        }

        if (!isBotExact && senderNumber && botNumber && 
            senderNumber.length >= 10 && botNumber.length >= 10) {
            isBotFallback = senderNumber.slice(-10) === botNumber.slice(-10);
        }

        return isOwnerExact || isOwnerFallback || isBotExact || isBotFallback;

    } catch (error) {
        if (CONFIG.logErrors) {
            console.error('❌ Owner check error:', error.message);
        }
        return false;
    }
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

        // Protection systems (Groups only)
        if (from.endsWith('@g.us')) {
            try {
                await Promise.all([
                    antilink.handleMessage(sock, msg),
                    antiswear.handleMessage(sock, msg),
                    antispam.handleMessage(sock, msg)
                ]);
            } catch (error) {
                if (CONFIG.logErrors) {
                    console.error('❌ Protection error:', error.message);
                }
            }
        }

        // Handle status broadcasts
        if (from === 'status@broadcast') {
            if (CONFIG.autoViewStatus) {
                await handleStatusView(sock, msg, CONFIG);
            }
            return;
        }

        // Extract sender using Alt fields for @lid support
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup 
            ? (msg.key.participantAlt || msg.key.participant || from)
            : (msg.key.remoteJidAlt || from);

        if (!sender) return;

        const userName = getUserName(msg);
        const isOwner = isOwnerMessage(msg, sock, CONFIG);
        const isAdminUser = isOwner ? true : isAdmin(sender, CONFIG.admins);
        const text = extractMessageText(msg);
        const isCommand = text && (text.startsWith('/') || text.startsWith('!'));

        // Save user session (exclude owner)
        if (!isOwner) {
            addOrUpdateUser(from, userName, isGroup);
        }

        // Auto-react
        if (CONFIG.autoReact && !isCommand && !isOwner) {
            const reactChance = CONFIG.reactChance || 0.3;
            if (Math.random() < reactChance) {
                await autoReactToMessage(sock, from, msg, CONFIG);
            }
        }

        // Ignore owner's non-command messages
        if (isOwner && !isCommand) return;

        // Private mode enforcement
        if (CONFIG.botMode === 'private' && !isAdminUser && !isOwner && isCommand) {
            return;
        }

        // Welcome new users
        if (shouldSendWelcome(CONFIG, isAdminUser, isGroup, from, isOwner)) {
            welcomedUsers.add(from);
        }

        // Handle special sessions
        if (await handleTxt2ImgSession(sock, from, msg, text, userName)) return;
        if (await handleSongSelection(sock, from, msg, text, commands)) return;

        // AI chat integration
        if (!isCommand && text && !isOwner) {
            const shouldRespondWithAI = checkIfShouldRespondWithAI(msg, from, isGroup, sock);
            if (shouldRespondWithAI) {
                const aiHandled = await chatAI.handleAIChat(sock, from, text, msg);
                if (aiHandled) return;
            }
        }

        // Execute command
        if (isCommand && text) {
            await executeCommand(sock, from, text, msg, isAdminUser, isOwner, CONFIG, commands);
        }

    } catch (error) {
        if (CONFIG.logErrors) {
            console.error('❌ Message handler error:', error.message);
        }
    }
}

// ============================================
// AUTO-REACT FUNCTION
// ============================================
async function autoReactToMessage(sock, from, msg, CONFIG) {
    try {
        const emojis = CONFIG.reactEmojis || ['❤️', '👍', '🔥', '😂', '✨'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        await sock.sendMessage(from, {
            react: { text: emoji, key: msg.key }
        });
    } catch (error) {
        // Silently fail - reactions are non-critical
    }
}

// ============================================
// AI TRIGGER DETECTION
// ============================================
function checkIfShouldRespondWithAI(msg, from, isGroup, sock) {
    if (!isGroup) return true;

    try {
        const botNumber = sock.user?.id?.split(':')[0];
        const botJid = botNumber ? `${botNumber}@s.whatsapp.net` : null;

        // Check mentions
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMentioned = mentionedJids.some(jid => {
            const mentionNumber = getCleanNumber(jid);
            return mentionNumber && botNumber && mentionNumber === botNumber;
        });

        if (isMentioned) return true;

        // Check replies to bot
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (contextInfo) {
            if (contextInfo.fromMe === true) return true;

            if (contextInfo.participant) {
                const quotedNumber = getCleanNumber(contextInfo.participant);
                if (quotedNumber && botNumber && quotedNumber === botNumber) return true;
            }
        }

        // Check text for bot tag
        const messageText = extractMessageText(msg);
        if (messageText && botNumber && messageText.includes(`@${botNumber}`)) return true;

        return false;

    } catch (error) {
        return false;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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
    } catch (error) {
        // Silently fail
    }
}

async function handleTxt2ImgSession(sock, from, msg, text, userName) {
    try {
        const txt2img = require('../commands/txt2img');
        if (!txt2img?.userSessions) return false;

        const session = txt2img.userSessions.get(from);
        if (session && /^[1-5]$/.test(text.trim())) {
            txt2img.userSessions.delete(from);
            if (txt2img.generateImage) {
                await txt2img.generateImage(sock, from, msg, session.prompt, text.trim());
            }
            return true;
        }
    } catch (error) {
        // Silently fail
    }
    return false;
}

async function handleSongSelection(sock, from, msg, text, commands) {
    try {
        if (!text || !/^[12]$/.test(text.trim())) return false;

        const songCommand = commands['song'];
        if (!songCommand) return false;

        await songCommand.exec(sock, from, [text.trim()], msg, false);
        return true;

    } catch (error) {
        return false;
    }
}

function shouldSendWelcome(CONFIG, isAdminUser, isGroup, from, isOwner) {
    return (CONFIG.botMode === 'public' || isAdminUser) && 
           !isGroup && 
           !welcomedUsers.has(from) && 
           !isOwner;
}

// ============================================
// COMMAND EXECUTION
// ============================================
async function executeCommand(sock, from, text, msg, isAdminUser, isOwner, CONFIG, commands) {
    const parts = text.trim().split(/\s+/);
    const command = parts[0].toLowerCase().replace(/^[!/]/, '');
    const args = parts.slice(1);

    try {
        if (!commands[command]) return;

        const cmd = commands[command];

        // Owner-only command check
        if (cmd.owner && !isOwner) {
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ OWNER ONLY ⌟* ❏\n│\n` +
                    `├◆ 👑 This command is restricted to the bot owner\n` +
                    `├◆ 🔒 Command: /${command}\n` +
                    `├◆ ⛔ Access denied\n│\n` +
                    `└ ❏\n> 🎭${CONFIG.botName}🎭`
            }, { quoted: msg }).catch(() => {});
            return;
        }

        // Admin-only command check
        if (cmd.admin && !isAdminUser && !isOwner) {
            if (CONFIG.botMode === 'public') {
                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ACCESS DENIED ⌟* ❏\n│\n` +
                        `├◆ ⛔ This command requires admin privileges\n` +
                        `├◆ 🔒 Command: /${command}\n│\n` +
                        `└ ❏\n> 🎭${CONFIG.botName}🎭`
                }, { quoted: msg }).catch(() => {});
            }
            return;
        }

        // Execute command
        await cmd.exec(sock, from, args, msg, isAdminUser || isOwner);

    } catch (error) {
        if (CONFIG.logErrors) {
            console.error(`❌ Command error [/${command}]:`, error.message);
        }

        await sock.sendMessage(from, {
            text: `┌ ❏ *⌜ COMMAND ERROR ⌟* ❏\n│\n` +
                `├◆ ❌ Command failed to execute\n` +
                `├◆ 🔧 Command: /${command}\n` +
                `├◆ 💥 Error: ${error.message}\n│\n` +
                `└ ❏\n> 🎭${CONFIG.botName}🎭`
        }, { quoted: msg }).catch(() => {});
    }
}

module.exports = { handleMessage };