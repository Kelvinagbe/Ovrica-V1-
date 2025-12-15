const { addOrUpdateUser } = require('./session-manager');
const { isAdmin, getUserName, getCleanNumber, normalizeJid } = require('./helpers');
const chatAI = require('../src/db/chatAI');
const antilink = require('../src/cmd/antilink');
const antiswear = require('../src/cmd/antiswear');
const antispam = require('../src/cmd/antispam');

const ownerCache = new Map();
const adminCache = new Map();
const textCache = new WeakMap();

let welcomedUsers, statusViewed;
try {
    const state = require('../index');
    welcomedUsers = state.welcomedUsers || new Set();
    statusViewed = state.statusViewed || new Set();
} catch {
    welcomedUsers = new Set();
    statusViewed = new Set();
}

// Initialize global download sessions storage
if (!global.pendingDownloads) {
    global.pendingDownloads = {};
}

function isOwnerMessage(msg, sock, CONFIG) {
    try {
        if (msg.key.fromMe === true) return true;
        const from = msg.key.remoteJid;
        const isGroup = from?.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || msg.key.participantAlt) : from;
        if (!sender) return false;

        const cacheKey = `${sender}-${Date.now() >> 16}`;
        if (ownerCache.has(cacheKey)) return ownerCache.get(cacheKey);

        const senderNumber = getCleanNumber(normalizeJid(sender));
        const ownerNumber = getCleanNumber(CONFIG.ownerNumber);
        const botNumber = getCleanNumber(sock.user?.id || '');
        const isOwner = senderNumber === ownerNumber || senderNumber === botNumber || 
                       senderNumber?.slice(-10) === ownerNumber?.slice(-10);

        ownerCache.set(cacheKey, isOwner);
        if (ownerCache.size > 100) Array.from(ownerCache.keys()).slice(0, 50).forEach(k => ownerCache.delete(k));
        return isOwner;
    } catch { return false; }
}

function extractMessageText(msg) {
    if (textCache.has(msg)) return textCache.get(msg);
    try {
        const text = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || 
                     msg.message?.videoMessage?.caption || 
                     msg.message?.documentMessage?.caption || '';
        textCache.set(msg, text);
        return text;
    } catch { return ''; }
}

function extractButtonResponse(msg) {
    try {
        return msg.message?.buttonsResponseMessage?.selectedButtonId ||
               msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
               msg.message?.templateButtonReplyMessage?.selectedId || null;
    } catch { return null; }
}

function isAdminUserCached(sender, CONFIG) {
    const cacheKey = `${sender}-${Date.now() >> 16}`;
    if (adminCache.has(cacheKey)) return adminCache.get(cacheKey);
    const result = isAdmin(sender, CONFIG.admins);
    adminCache.set(cacheKey, result);
    if (adminCache.size > 100) Array.from(adminCache.keys()).slice(0, 50).forEach(k => adminCache.delete(k));
    return result;
}

function checkIfShouldRespondWithAI(msg, from, isGroup, sock) {
    if (!isGroup) return true;
    try {
        const botNumber = sock.user?.id?.split(':')[0];
        if (!botNumber) return false;

        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentionedJids?.some(jid => getCleanNumber(jid) === botNumber)) return true;

        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (contextInfo?.fromMe === true) return true;
        if (contextInfo?.participant && getCleanNumber(contextInfo.participant) === botNumber) return true;

        const messageText = textCache.get(msg);
        if (messageText?.includes(`@${botNumber}`)) return true;
        return false;
    } catch { return false; }
}

function handleStatusView(sock, msg, CONFIG) {
    sock.readMessages([msg.key]).catch(() => {});
    if (CONFIG.autoReact && CONFIG.reactEmojis?.length > 0) {
        const emoji = CONFIG.reactEmojis[Math.floor(Math.random() * CONFIG.reactEmojis.length)];
        sock.sendMessage('status@broadcast', { react: { text: emoji, key: msg.key } }).catch(() => {});
    }
    if (msg.key.participant) statusViewed.add(msg.key.participant);
}

function autoReactToMessage(sock, from, msg, CONFIG) {
    try {
        const emojis = CONFIG.reactEmojis || ['❤️', '👍', '🔥', '😂', '✨'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        sock.sendMessage(from, { react: { text: emoji, key: msg.key } }).catch(() => {});
    } catch {}
}

async function handleTxt2ImgSession(sock, from, msg, text, userName) {
    try {
        const txt2img = require('../commands/txt2img');
        if (!txt2img?.userSessions) return false;
        const session = txt2img.userSessions.get(from);
        if (session && /^[1-5]$/.test(text?.trim())) {
            txt2img.userSessions.delete(from);
            if (txt2img.generateImage) await txt2img.generateImage(sock, from, msg, session.prompt, text.trim());
            return true;
        }
    } catch {}
    return false;
}

async function handleYouTubeDownloadSession(sock, from, msg, text, commands) {
    try {
        if (!text || !/^[12]$/.test(text.trim())) return false;
        
        // Check if there's a pending download session
        if (!global.pendingDownloads || !global.pendingDownloads[from]) return false;
        
        const download = global.pendingDownloads[from];
        
        // Check if session expired (5 minutes)
        if (Date.now() - download.timestamp > 300000) {
            await sock.sendMessage(from, {
                text: '❌ Download session expired. Please search again.'
            }, { quoted: msg });
            delete global.pendingDownloads[from];
            return true;
        }
        
        const choice = text.trim();
        
        if (choice === '1') {
            // Download audio
            const playCommand = commands['play'];
            if (playCommand) {
                await playCommand.exec(sock, from, [download.url], msg, false, async (s, f, content) => {
                    await sock.sendMessage(f, typeof content === 'string' ? { text: content } : content);
                });
            }
        } else if (choice === '2') {
            // Download video
            const videoCommand = commands['video'];
            if (videoCommand) {
                await videoCommand.exec(sock, from, [download.url], msg, false, async (s, f, content) => {
                    await sock.sendMessage(f, typeof content === 'string' ? { text: content } : content);
                });
            }
        }
        
        // Clean up session
        delete global.pendingDownloads[from];
        return true;
        
    } catch (error) {
        console.error('YouTube download session error:', error);
        return false;
    }
}

async function handleSongSelection(sock, from, msg, text, commands) {
    try {
        if (!text || !/^[12]$/.test(text.trim())) return false;
        const songCommand = commands['song'];
        if (!songCommand) return false;
        await songCommand.exec(sock, from, [text.trim()], msg, false);
        return true;
    } catch { return false; }
}

async function executeCommand(sock, from, text, msg, isAdminUser, isOwner, CONFIG, commands) {
    const commandPrefix = text[0];
    const spaceIndex = text.indexOf(' ');
    const command = (spaceIndex === -1 ? text.slice(1) : text.slice(1, spaceIndex)).toLowerCase();
    const args = spaceIndex === -1 ? [] : text.slice(spaceIndex + 1).split(/\s+/);

    try {
        const cmd = commands[command];
        if (!cmd) return;

        if (cmd.owner && !isOwner) {
            sock.sendMessage(from, {
                text: `┌ ❏ *⌜ OWNER ONLY ⌟* ❏\n│\n├◆ 👑 Restricted to bot owner\n├◆ 🔒 Command: ${commandPrefix}${command}\n├◆ ⛔ Access denied\n│\n└ ❏\n> 🎭${CONFIG.botName}🎭`
            }, { quoted: msg }).catch(() => {});
            return;
        }

        if (cmd.admin && !isAdminUser && !isOwner) {
            if (CONFIG.botMode === 'public') {
                sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ACCESS DENIED ⌟* ❏\n│\n├◆ ⛔ Requires admin privileges\n├◆ 🔒 Command: ${commandPrefix}${command}\n│\n└ ❏\n> 🎭${CONFIG.botName}🎭`
                }, { quoted: msg }).catch(() => {});
            }
            return;
        }

        // Create sendWithTyping helper function
        const sendWithTyping = async (s, f, content) => {
            await sock.sendMessage(f, typeof content === 'string' ? { text: content } : content);
        };

        await cmd.exec(sock, from, args, msg, isAdminUser || isOwner, sendWithTyping);
    } catch (error) {
        if (CONFIG.logErrors) console.error(`❌ Command error [${commandPrefix}${command}]:`, error.message);
        sock.sendMessage(from, {
            text: `┌ ❏ *⌜ COMMAND ERROR ⌟* ❏\n│\n├◆ ❌ Failed to execute\n├◆ 🔧 Command: ${commandPrefix}${command}\n├◆ 💥 Error: ${error.message}\n│\n└ ❏\n> 🎭${CONFIG.botName}🎭`
        }, { quoted: msg }).catch(() => {});
    }
}

async function handleMessage(messages, sock, CONFIG, commands) {
    try {
        const msg = messages[0];
        if (!msg?.message) return;
        const from = msg.key?.remoteJid;
        if (!from) return;

        if (from === 'status@broadcast') {
            if (CONFIG.autoViewStatus) handleStatusView(sock, msg, CONFIG);
            return;
        }

        const buttonResponse = extractButtonResponse(msg);
        if (buttonResponse) {
            const isOwner = isOwnerMessage(msg, sock, CONFIG);
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? (msg.key.participant || from) : from;
            const isAdminUser = isOwner || isAdminUserCached(sender, CONFIG);
            await executeCommand(sock, from, buttonResponse, msg, isAdminUser, isOwner, CONFIG, commands);
            return;
        }

        const text = extractMessageText(msg);
        const isCommand = text?.[0] === '/' || text?.[0] === '!';
        const isOwner = isOwnerMessage(msg, sock, CONFIG);
        if (isOwner && !isCommand) return;

        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || from) : from;
        if (!sender) return;

        const isAdminUser = isOwner || isAdminUserCached(sender, CONFIG);
        if (CONFIG.botMode === 'private' && !isAdminUser && !isOwner && isCommand) return;

        if (isGroup) {
            Promise.all([
                antilink.handleMessage(sock, msg).catch(() => {}),
                antiswear.handleMessage(sock, msg).catch(() => {}),
                antispam.handleMessage(sock, msg).catch(() => {})
            ]).catch(() => {});
        }

        if (!isOwner) setImmediate(() => addOrUpdateUser(from, getUserName(msg), isGroup));
        if ((CONFIG.botMode === 'public' || isAdminUser) && !isGroup && !welcomedUsers.has(from) && !isOwner) {
            welcomedUsers.add(from);
        }

        if (isCommand) {
            await executeCommand(sock, from, text, msg, isAdminUser, isOwner, CONFIG, commands);
            return;
        }

        // Handle numeric replies for sessions (order matters!)
        if (await handleTxt2ImgSession(sock, from, msg, text, getUserName(msg))) return;
        if (await handleYouTubeDownloadSession(sock, from, msg, text, commands)) return;
        if (await handleSongSelection(sock, from, msg, text, commands)) return;

        if (text && !isOwner && checkIfShouldRespondWithAI(msg, from, isGroup, sock)) {
            chatAI.handleAIChat(sock, from, text, msg).catch(() => {});
            return;
        }

        if (CONFIG.autoReact && !isCommand && !isOwner && Math.random() < (CONFIG.reactChance || 0.3)) {
            setImmediate(() => autoReactToMessage(sock, from, msg, CONFIG));
        }
    } catch (error) {
        if (CONFIG.logErrors) console.error('❌ Message handler error:', error.message);
    }
}

module.exports = { handleMessage };