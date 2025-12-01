// FILE: utils/message-handler.js
// FIXED: Owner detection using participant matching in groups

const { addOrUpdateUser } = require('./session-manager');
const { isAdmin, getUserName, getCleanNumber } = require('./helpers');
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
// ✅ FIXED: Owner detection that works in groups
// ============================================
function isOwnerMessage(msg, sock, CONFIG) {
    try {
        // Method 1: Message sent by bot itself
        if (msg.key.fromMe === true) {
            return true;
        }

        // Method 2: Check sender number against owner number
        const from = msg.key.remoteJid;
        const isGroup = from && from.endsWith('@g.us');
        
        // Get sender JID
        const sender = isGroup 
            ? (msg.key.participant || from) 
            : from;

        if (!sender) return false;

        // Extract clean numbers for comparison
        const senderNumber = getCleanNumber(sender);
        const ownerNumber = getCleanNumber(CONFIG.ownerNumber);
        const botNumber = sock.user?.id ? getCleanNumber(sock.user.id) : null;

        // Check if sender matches owner or bot number
        return senderNumber === ownerNumber || senderNumber === botNumber;

    } catch (error) {
        console.error('❌ Owner check error:', error.message);
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

        // ============================================
        // PROTECTION SYSTEMS (Groups Only) - Silent mode
        // ============================================
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

        // Extract sender info
        const sender = from.endsWith('@g.us') 
            ? (msg.key.participant || from) 
            : from;

        if (!sender) return;

        const isGroup = from.endsWith('@g.us');
        const userName = getUserName(msg);

        // ✅ FIX: Use improved owner detection
        const isOwner = isOwnerMessage(msg, sock, CONFIG);
        
        // Owner automatically counts as admin
        const admin = isOwner ? true : isAdmin(sender, CONFIG.admins);

        // Extract message text
        const text = extractMessageText(msg);
        const isCommand = text && (text.startsWith('/') || text.startsWith('!'));

        // 🔍 DEBUG: Log permission info for group commands
        if (isCommand && isGroup) {
            const senderNum = getCleanNumber(sender);
            const ownerNum = getCleanNumber(CONFIG.ownerNumber);
            console.log('━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔍 GROUP COMMAND:');
            console.log(`├─ From: ${from}`);
            console.log(`├─ Sender: ${sender}`);
            console.log(`├─ Sender #: ${senderNum}`);
            console.log(`├─ Owner #: ${ownerNum}`);
            console.log(`├─ Match: ${senderNum === ownerNum}`);
            console.log(`├─ fromMe: ${msg.key.fromMe}`);
            console.log(`├─ isOwner: ${isOwner}`);
            console.log(`├─ isAdmin: ${admin}`);
            console.log(`└─ Command: ${text.split(' ')[0]}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━');
        }

        // Save user session (exclude owner)
        if (!isOwner) {
            addOrUpdateUser(from, userName, isGroup);
        }

        // Log owner commands
        if (isOwner && isCommand) {
            console.log(`👑 Owner: ${text.substring(0, 50)}`);
        }

        // ============================================
        // AUTO-REACT - Works for ALL users now
        // ============================================
        if (CONFIG.autoReact && !isCommand && !isOwner) {
            const reactChance = CONFIG.reactChance || 0.3;

            if (Math.random() < reactChance) {
                await autoReactToMessage(sock, from, msg, CONFIG);
            }
        }

        // Owner non-commands are ignored
        if (isOwner && !isCommand) return;

        // Private mode enforcement
        if (CONFIG.botMode === 'private' && !admin && !isOwner && isCommand) {
            console.log(`🔒 Blocked: ${userName}`);
            return;
        }

        // Welcome new users
        if (shouldSendWelcome(CONFIG, admin, isGroup, from, isOwner)) {
            welcomedUsers.add(from);
        }

        // Handle special sessions
        if (await handleTxt2ImgSession(sock, from, msg, text, userName)) return;
        if (await handleSongSelection(sock, from, msg, text, commands)) return;

        // ============================================
        // AI CHAT INTEGRATION
        // ============================================
        if (!isCommand && text && !isOwner) {
            const shouldRespondWithAI = checkIfShouldRespondWithAI(msg, from, isGroup, sock);

            if (shouldRespondWithAI) {
                console.log('✅ AI responding');
                const aiHandled = await chatAI.handleAIChat(sock, from, text, msg);
                if (aiHandled) return;
            }
        }

        // Execute command
        if (isCommand && text) {
            await executeCommand(sock, from, text, msg, admin, isOwner, CONFIG, commands);
        }

    } catch (error) {
        if (CONFIG.logErrors) {
            console.error('❌ Handler error:', error.message);
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

        // Only log occasionally to reduce spam
        if (Math.random() < 0.1) {
            console.log(`🎭 Reacted with ${emoji}`);
        }
    } catch (error) {
        // Silently fail - reactions are non-critical
    }
}

// ============================================
// AI TRIGGER DETECTION
// ============================================
function checkIfShouldRespondWithAI(msg, from, isGroup, sock) {
    if (!isGroup) {
        console.log('🤖 AI: DM');
        return true;
    }

    try {
        const botNumber = sock.user?.id?.split(':')[0];
        const botJid = `${botNumber}@s.whatsapp.net`;

        // Check mentions
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMentioned = mentionedJids.some(jid => 
            jid === botJid || jid.includes(botNumber)
        );

        if (isMentioned) {
            console.log('🤖 AI: Mentioned');
            return true;
        }

        // Check replies to bot
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (contextInfo) {
            const quotedParticipant = contextInfo.participant;
            const isFromMe = contextInfo.fromMe;

            if (isFromMe === true || quotedParticipant === botJid || quotedParticipant?.includes(botNumber)) {
                console.log('🤖 AI: Reply to bot');
                return true;
            }
        }

        // Check text for bot tag
        const messageText = extractMessageText(msg);
        if (messageText && botNumber && messageText.includes(`@${botNumber}`)) {
            console.log('🤖 AI: Tagged in text');
            return true;
        }

        return false;

    } catch (error) {
        console.error('❌ AI trigger error:', error);
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
        console.log('✅ Status viewed');
    } catch {}
}

async function handleTxt2ImgSession(sock, from, msg, text, userName) {
    try {
        const txt2img = require('../commands/txt2img');
        if (!txt2img?.userSessions) return false;

        const session = txt2img.userSessions.get(from);
        if (session && /^[1-5]$/.test(text.trim())) {
            console.log(`🎨 txt2img style ${text.trim()}`);
            txt2img.userSessions.delete(from);
            if (txt2img.generateImage) {
                await txt2img.generateImage(sock, from, msg, session.prompt, text.trim());
            }
            return true;
        }
    } catch {}
    return false;
}

async function handleSongSelection(sock, from, msg, text, commands) {
    try {
        if (!text || !/^[12]$/.test(text.trim())) return false;

        const songCommand = commands['song'];
        if (!songCommand) return false;

        console.log(`🎵 Song selection: ${text.trim()}`);
        await songCommand.exec(sock, from, [text.trim()], msg, false);
        return true;

    } catch (error) {
        console.error('❌ Song selection error:', error);
        return false;
    }
}

function shouldSendWelcome(CONFIG, admin, isGroup, from, isOwner) {
    return (CONFIG.botMode === 'public' || admin) && 
           !isGroup && 
           !welcomedUsers.has(from) && 
           !isOwner;
}

async function executeCommand(sock, from, text, msg, admin, isOwner, CONFIG, commands) {
    try {
        const parts = text.trim().split(/\s+/);
        const command = parts[0].toLowerCase().replace(/^[!/]/, '');
        const args = parts.slice(1);

        if (!commands[command]) return;

        // OWNER CHECK
        if (commands[command].owner && !isOwner) {
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ OWNER ONLY ⌟* ❏\n│\n` +
                    `├◆ 👑 Restricted to bot owner\n` +
                    `├◆ 🔒 Command: /${command}\n` +
                    `├◆ ⛔ Access denied\n│\n` +
                    `└ ❏\n> 🎭${CONFIG.botName}🎭`
            }, { quoted: msg }).catch(() => {});
            return;
        }

        // ADMIN CHECK
        if (commands[command].admin && !admin && !isOwner) {
            if (CONFIG.botMode === 'public') {
                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ACCESS DENIED ⌟* ❏\n│\n` +
                        `├◆ ⛔ Admin only\n` +
                        `├◆ 🔒 Command: /${command}\n│\n` +
                        `└ ❏\n> 🎭${CONFIG.botName}🎭`
                }, { quoted: msg }).catch(() => {});
            }
            return;
        }

        // EXECUTE
        if (CONFIG.logCommands) {
            const type = isOwner ? '(Owner)' : (admin ? '(Admin)' : '(User)');
            console.log(`⚡ /${command} ${type}`);
        }

        await commands[command].exec(sock, from, args, msg, admin || isOwner);

    } catch (error) {
        console.error(`❌ Command error [${command}]:`, error.message);

        await sock.sendMessage(from, {
            text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                `├◆ ❌ Command failed\n` +
                `├◆ 🔧 Command: /${command}\n` +
                `├◆ 💥 ${error.message}\n│\n` +
                `└ ❏\n> 🎭${CONFIG.botName}🎭`
        }, { quoted: msg }).catch(() => {});
    }
}

module.exports = { handleMessage };