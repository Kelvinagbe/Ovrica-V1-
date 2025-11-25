// FILE: utils/message-handler.js
// Enhanced message handler with AI chat triggers

const { addOrUpdateUser } = require('./session-manager');
const { isAdmin, getUserName } = require('./helpers');
const chatAI = require('../src/db/chatAI');

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

        // Extract sender info
        const sender = from.endsWith('@g.us') 
            ? (msg.key.participant || from) 
            : from;

        if (!sender) return;

        const isOwner = msg.key.fromMe === true;
        const isGroup = from.endsWith('@g.us');
        const userName = getUserName(msg);
        const admin = isAdmin(sender, CONFIG.admins);

        // Save user session (exclude owner)
        if (!isOwner) {
            addOrUpdateUser(from, userName, isGroup);
        }

        // Extract message text
        const text = extractMessageText(msg);

        // Handle txt2img session
        if (await handleTxt2ImgSession(sock, from, msg, text, userName)) {
            return;
        }

        // Check if command
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

        // Welcome new users
        if (shouldSendWelcome(CONFIG, admin, isGroup, from, isOwner)) {
            welcomedUsers.add(from);
        }

        // Auto-react
        if (shouldAutoReact(CONFIG, admin, isOwner)) {
            await autoReactToMessage(sock, from, msg, CONFIG);
        }

        // ============================================
        // AI CHAT INTEGRATION
        // ============================================
        if (!isCommand && text && !isOwner) {
            const shouldRespondWithAI = checkIfShouldRespondWithAI(msg, from, isGroup, sock);

            if (shouldRespondWithAI) {
                console.log('✅ AI responding');
                const aiHandled = await chatAI.handleAIChat(sock, from, text, msg);
                if (aiHandled) {
                    return;
                }
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
// AI TRIGGER DETECTION
// ============================================
function checkIfShouldRespondWithAI(msg, from, isGroup, sock) {
    // Always respond in DMs
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

function shouldSendWelcome(CONFIG, admin, isGroup, from, isOwner) {
    return (CONFIG.botMode === 'public' || admin) && 
           !isGroup && 
           !welcomedUsers.has(from) && 
           !isOwner;
}

function shouldAutoReact(CONFIG, admin, isOwner) {
    return (CONFIG.botMode === 'public' || admin) && 
           CONFIG.autoReact && 
           Math.random() < 0.3 && 
           !isOwner;
}

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
    } catch {}
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