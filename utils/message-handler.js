// FILE: utils/message-handler.js
// COMPLETE REWRITE - Fixed owner detection for groups and DMs with @lid support

const { addOrUpdateUser } = require('./session-manager');
const { isAdmin, getUserName, getCleanNumber, normalizeJid, getSender } = require('./helpers');
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
// ✅ OWNER DETECTION - Works in groups and DMs
// ============================================
function isOwnerMessage(msg, sock, CONFIG) {
    try {
        // Method 1: Message sent by bot itself
        if (msg.key.fromMe === true) {
            console.log('✅ Owner: Message fromMe=true');
            return true;
        }

        const from = msg.key.remoteJid;
        const isGroup = from && from.endsWith('@g.us');

        // ============================================
        // 🔥 CRITICAL FIX: Handle @lid in groups
        // ============================================
        let sender;
        
        if (isGroup) {
            // Priority 1: participantPn (real phone number, handles @lid)
            // Priority 2: participant (may be @lid format)
            sender = msg.key.participantPn || msg.key.participant;

            // If still @lid, try contextInfo for real JID
            if (sender && sender.endsWith('@lid')) {
                const contextParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
                if (contextParticipant && !contextParticipant.endsWith('@lid')) {
                    sender = contextParticipant;
                    console.log('🔄 Using contextInfo participant:', sender);
                } else {
                    // Last resort: normalize @lid to standard JID
                    sender = normalizeJid(sender);
                    console.log('🔄 Normalized @lid to:', sender);
                }
            }
        } else {
            // DMs: use remoteJid directly
            sender = from;
        }

        if (!sender) {
            console.log('❌ Owner check: No sender found');
            return false;
        }

        // Normalize sender to standard JID format
        sender = normalizeJid(sender);

        // Extract clean phone numbers for comparison
        const senderNumber = getCleanNumber(sender);
        const ownerNumber = getCleanNumber(CONFIG.ownerNumber);
        
        // Get bot number from sock.user.id
        // Format: "1234567890:1@s.whatsapp.net" or "1234567890@s.whatsapp.net"
        const rawBotId = sock.user?.id || '';
        const botNumber = getCleanNumber(rawBotId);

        // ============================================
        // 🔍 DETAILED DEBUG OUTPUT
        // ============================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 OWNER CHECK DEBUG:');
        console.log('  Chat Type:', isGroup ? 'GROUP' : 'DM');
        console.log('  Chat (from):', from);
        console.log('  ');
        console.log('  Raw Values:');
        console.log('    msg.key.participant:', msg.key.participant || 'N/A');
        console.log('    msg.key.participantPn:', msg.key.participantPn || 'N/A');
        console.log('  ');
        console.log('  Processed Values:');
        console.log('    Sender (final):', sender);
        console.log('    Sender # (clean):', senderNumber);
        console.log('  ');
        console.log('  Comparison Targets:');
        console.log('    Owner # (clean):', ownerNumber);
        console.log('    Owner (CONFIG):', CONFIG.ownerNumber);
        console.log('    Bot # (clean):', botNumber);
        console.log('    Bot (sock.user.id):', rawBotId);

        // ============================================
        // MATCHING LOGIC
        // ============================================
        
        // Primary: Exact match
        const isOwnerExact = senderNumber && ownerNumber && (senderNumber === ownerNumber);
        const isBotExact = senderNumber && botNumber && (senderNumber === botNumber);

        // Fallback: Last 10 digits match (handles country code variations)
        let isOwnerFallback = false;
        let isBotFallback = false;

        if (!isOwnerExact && senderNumber && ownerNumber && 
            senderNumber.length >= 10 && ownerNumber.length >= 10) {
            const senderLast10 = senderNumber.slice(-10);
            const ownerLast10 = ownerNumber.slice(-10);
            isOwnerFallback = senderLast10 === ownerLast10;
        }

        if (!isBotExact && senderNumber && botNumber && 
            senderNumber.length >= 10 && botNumber.length >= 10) {
            const senderLast10 = senderNumber.slice(-10);
            const botLast10 = botNumber.slice(-10);
            isBotFallback = senderLast10 === botLast10;
        }

        const isOwnerMatch = isOwnerExact || isOwnerFallback;
        const isBotMatch = isBotExact || isBotFallback;
        const result = isOwnerMatch || isBotMatch;

        console.log('  ');
        console.log('  Match Results:');
        console.log('    Sender === Owner (exact)?:', isOwnerExact);
        if (isOwnerFallback) {
            console.log('    Sender === Owner (fallback)?:', true, '[last 10 digits]');
        }
        console.log('    Sender === Bot (exact)?:', isBotExact);
        if (isBotFallback) {
            console.log('    Sender === Bot (fallback)?:', true, '[last 10 digits]');
        }
        console.log('  ');
        console.log('  🎯 FINAL RESULT:', result ? '✅ IS OWNER' : '❌ NOT OWNER');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return result;

    } catch (error) {
        console.error('❌ Owner check error:', error.message);
        console.error('   Stack:', error.stack);
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
        // PROTECTION SYSTEMS (Groups Only)
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

        // Extract sender info using helper function
        const sender = getSender(msg);
        if (!sender) return;

        const isGroup = from.endsWith('@g.us');
        const userName = getUserName(msg);

        // ✅ CRITICAL: Check owner status FIRST
        const isOwner = isOwnerMessage(msg, sock, CONFIG);

        // ✅ CRITICAL: Check admin status (owner is auto-admin)
        const isAdminUser = isOwner ? true : isAdmin(sender, CONFIG.admins);

        // Extract message text
        const text = extractMessageText(msg);
        const isCommand = text && (text.startsWith('/') || text.startsWith('!'));

        // ============================================
        // DEBUG: Log all command attempts
        // ============================================
        if (isCommand) {
            const commandName = text.split(' ')[0];
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⚡ COMMAND ATTEMPT:');
            console.log(`├─ User: ${userName}`);
            console.log(`├─ Chat: ${isGroup ? 'GROUP' : 'DM'}`);
            console.log(`├─ From: ${from}`);
            console.log(`├─ Sender: ${sender}`);
            console.log(`├─ Is Owner: ${isOwner ? '✅ YES' : '❌ NO'}`);
            console.log(`├─ Is Admin: ${isAdminUser ? '✅ YES' : '❌ NO'}`);
            console.log(`├─ Command: ${commandName}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

        // Save user session (exclude owner)
        if (!isOwner) {
            addOrUpdateUser(from, userName, isGroup);
        }

        // ============================================
        // AUTO-REACT
        // ============================================
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
            console.log(`🔒 Private mode: Blocked ${userName}`);
            return;
        }

        // Welcome new users
        if (shouldSendWelcome(CONFIG, isAdminUser, isGroup, from, isOwner)) {
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
                console.log('🤖 AI responding to message');
                const aiHandled = await chatAI.handleAIChat(sock, from, text, msg);
                if (aiHandled) return;
            }
        }

        // ============================================
        // EXECUTE COMMAND
        // ============================================
        if (isCommand && text) {
            await executeCommand(sock, from, text, msg, isAdminUser, isOwner, CONFIG, commands);
        }

    } catch (error) {
        if (CONFIG.logErrors) {
            console.error('❌ Message handler error:', error.message);
            console.error('   Stack:', error.stack);
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
            console.log(`🎭 Auto-reacted with ${emoji}`);
        }
    } catch (error) {
        // Silently fail - reactions are non-critical
    }
}

// ============================================
// AI TRIGGER DETECTION
// ============================================
function checkIfShouldRespondWithAI(msg, from, isGroup, sock) {
    // Always respond in DMs
    if (!isGroup) {
        console.log('🤖 AI: Direct message');
        return true;
    }

    try {
        const botNumber = sock.user?.id?.split(':')[0];
        const botJid = botNumber ? `${botNumber}@s.whatsapp.net` : null;

        // Check mentions
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMentioned = mentionedJids.some(jid => {
            const mentionNumber = getCleanNumber(jid);
            return mentionNumber && botNumber && mentionNumber === botNumber;
        });

        if (isMentioned) {
            console.log('🤖 AI: Bot mentioned');
            return true;
        }

        // Check replies to bot
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (contextInfo) {
            const quotedParticipant = contextInfo.participant;
            const isFromMe = contextInfo.fromMe;

            if (isFromMe === true) {
                console.log('🤖 AI: Reply to bot message (fromMe)');
                return true;
            }

            if (quotedParticipant) {
                const quotedNumber = getCleanNumber(quotedParticipant);
                if (quotedNumber && botNumber && quotedNumber === botNumber) {
                    console.log('🤖 AI: Reply to bot message (participant)');
                    return true;
                }
            }
        }

        // Check text for bot tag
        const messageText = extractMessageText(msg);
        if (messageText && botNumber && messageText.includes(`@${botNumber}`)) {
            console.log('🤖 AI: Bot tagged in text');
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
        console.log('✅ Status viewed and reacted');
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
            console.log(`🎨 txt2img style selection: ${text.trim()}`);
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

        console.log(`🎵 Song selection: ${text.trim()}`);
        await songCommand.exec(sock, from, [text.trim()], msg, false);
        return true;

    } catch (error) {
        console.error('❌ Song selection error:', error);
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
        if (!commands[command]) {
            console.log(`⚠️  Unknown command: /${command}`);
            return;
        }

        const cmd = commands[command];

        // ============================================
        // OWNER-ONLY COMMAND CHECK
        // ============================================
        if (cmd.owner && !isOwner) {
            console.log(`🚫 Owner command blocked: /${command} by ${getUserName(msg)}`);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ OWNER ONLY ⌟* ❏\n│\n` +
                    `├◆ 👑 This command is restricted to the bot owner\n` +
                    `├◆ 🔒 Command: /${command}\n` +
                    `├◆ ⛔ Access denied\n│\n` +
                    `└ ❏\n> 🎭${CONFIG.botName}🎭`
            }, { quoted: msg }).catch(() => {});
            return;
        }

        // ============================================
        // ADMIN-ONLY COMMAND CHECK
        // ============================================
        if (cmd.admin && !isAdminUser && !isOwner) {
            console.log(`🚫 Admin command blocked: /${command} by ${getUserName(msg)}`);
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

        // ============================================
        // EXECUTE COMMAND
        // ============================================
        if (CONFIG.logCommands) {
            const userType = isOwner ? '👑 OWNER' : (isAdminUser ? '⭐ ADMIN' : '👤 USER');
            console.log(`✅ /${command} executed by ${userType}`);
        }

        await cmd.exec(sock, from, args, msg, isAdminUser || isOwner);

    } catch (error) {
        console.error(`❌ Command execution error [/${command}]:`, error.message);
        console.error('   Stack:', error.stack);

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