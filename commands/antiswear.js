// commands/antiswear.js - Anti-Swear Protection (COMPLETE)
// No external dependencies needed

const fs = require('fs');
const path = require('path');

// Store antiswear settings
const settingsPath = path.join(__dirname, '../data/antiswear.json');

// Default bad words list
const defaultBadWords = [
    'fuck',
    'fuck you',
    'shit',
    'bitch',
    'idiot',
    'asshole',
    'bastard',
    'nigga',
    'nigger',
    'cunt',
    'damn',
    'hell',
    'dick',
    'pussy',
    'whore',
    'slut'
];

// Initialize settings file
function initSettings() {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(settingsPath)) {
        const defaultSettings = {
            groups: {},
            words: defaultBadWords
        };
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    }
}

// Load settings
function loadSettings() {
    initSettings();
    try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
        return { groups: {}, words: defaultBadWords };
    }
}

// Save settings
function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Check if antiswear is enabled for group
function isEnabled(groupId) {
    const settings = loadSettings();
    return settings.groups[groupId] || false;
}

// Enable/disable antiswear
function setEnabled(groupId, enabled) {
    const settings = loadSettings();
    settings.groups[groupId] = enabled;
    saveSettings(settings);
}

// Add bad word
function addWord(word) {
    const settings = loadSettings();
    const lowerWord = word.toLowerCase().trim();
    if (!settings.words.includes(lowerWord)) {
        settings.words.push(lowerWord);
        saveSettings(settings);
        return true;
    }
    return false;
}

// Remove bad word
function removeWord(word) {
    const settings = loadSettings();
    const lowerWord = word.toLowerCase().trim();
    const index = settings.words.indexOf(lowerWord);
    if (index > -1) {
        settings.words.splice(index, 1);
        saveSettings(settings);
        return true;
    }
    return false;
}

// Get all bad words
function getBadWords() {
    const settings = loadSettings();
    return settings.words || defaultBadWords;
}

// Check if message contains bad words
function containsBadWords(text) {
    const badWords = getBadWords();
    const lowerText = text.toLowerCase();
    
    for (const word of badWords) {
        // Create regex to match whole words or phrases
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(lowerText)) {
            return { found: true, word };
        }
    }
    return { found: false };
}

module.exports = {
    name: 'antiswear',
    alias: ['antswear', 'antibadword'],
    admin: false,
    description: 'Protect group from bad language',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            console.log('🤬 Antiswear command executed');

            // Check if group
            if (!from.endsWith('@g.us')) {
                return await sock.sendMessage(from, {
                    text: `❌ *This command only works in groups!*`
                }, { quoted: msg });
            }

            // Check if user is group admin
            const sender = msg.key.participant || msg.key.remoteJid;
            const groupMetadata = await sock.groupMetadata(from);
            const senderIsAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;

            if (!senderIsAdmin) {
                return await sock.sendMessage(from, {
                    text: `❌ *Admin only!*\n\nThis command can only be used by group admins.`
                }, { quoted: msg });
            }

            const action = args[0]?.toLowerCase();
            const param = args.slice(1).join(' ');

            // Show status if no action
            if (!action) {
                const settings = loadSettings();
                const enabled = settings.groups[from] || false;
                const wordCount = settings.words.length;

                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ANTI-SWEAR ⌟* ❏\n│\n` +
                        `├◆ 🤬 *Bad Language Protection*\n` +
                        `├◆ 📊 *Status:* ${enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                        `├◆ 📝 *Filtered Words:* ${wordCount}\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜COMMANDS⌟* ◆\n│\n` +
                        `├◆ /antiswear on - Enable filter\n` +
                        `├◆ /antiswear off - Disable filter\n` +
                        `├◆ /antiswear add <word> - Add bad word\n` +
                        `├◆ /antiswear remove <word> - Remove word\n` +
                        `├◆ /antiswear list - Show filtered words\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            // Handle actions
            switch (action) {
                case 'on':
                case 'enable':
                    setEnabled(from, true);
                    await sock.sendMessage(from, {
                        text: `✅ *Anti-swear enabled!*\n\n` +
                            `🤬 Bad words will be automatically deleted\n` +
                            `⚠️ Admins are exempt from filtering`
                    }, { quoted: msg });
                    break;

                case 'off':
                case 'disable':
                    setEnabled(from, false);
                    await sock.sendMessage(from, {
                        text: `❌ *Anti-swear disabled!*\n\n` +
                            `🤬 Bad words are no longer filtered`
                    }, { quoted: msg });
                    break;

                case 'add':
                    if (!param) {
                        return await sock.sendMessage(from, {
                            text: `❌ *Please specify a word!*\n\n` +
                                `📝 Usage: /antiswear add <word>`
                        }, { quoted: msg });
                    }
                    if (addWord(param)) {
                        await sock.sendMessage(from, {
                            text: `✅ *Word added to filter!*\n\n` +
                                `🚫 Word: ||${param}||`
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, {
                            text: `⚠️ *Word already in filter!*`
                        }, { quoted: msg });
                    }
                    break;

                case 'remove':
                case 'delete':
                    if (!param) {
                        return await sock.sendMessage(from, {
                            text: `❌ *Please specify a word!*\n\n` +
                                `📝 Usage: /antiswear remove <word>`
                        }, { quoted: msg });
                    }
                    if (removeWord(param)) {
                        await sock.sendMessage(from, {
                            text: `✅ *Word removed from filter!*\n\n` +
                                `✔️ Word: ${param}`
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, {
                            text: `⚠️ *Word not found in filter!*`
                        }, { quoted: msg });
                    }
                    break;

                case 'list':
                case 'show':
                    const words = getBadWords();
                    const censoredWords = words.map(w => `||${w}||`).join(', ');
                    await sock.sendMessage(from, {
                        text: `┌ ❏ *⌜ FILTERED WORDS ⌟* ❏\n│\n` +
                            `├◆ 📝 *Total:* ${words.length} words\n│\n` +
                            `├◆ 🚫 *Words:*\n` +
                            `├◆ ${censoredWords}\n│\n` +
                            `└ ❏\n> Powered by 🎭Kelvin🎭`
                    }, { quoted: msg });
                    break;

                default:
                    await sock.sendMessage(from, {
                        text: `❌ *Invalid action!*\n\n` +
                            `📝 Valid actions:\n` +
                            `• on/off\n` +
                            `• add/remove\n` +
                            `• list`
                    }, { quoted: msg });
            }

        } catch (error) {
            console.error('❌ Antiswear error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *Command failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    },

    // Message handler for checking bad words
    handleMessage: async (sock, msg) => {
        try {
            const from = msg.key.remoteJid;
            
            // Only check groups
            if (!from.endsWith('@g.us')) return;

            // Check if antiswear is enabled
            if (!isEnabled(from)) return;

            // Get message text
            const messageText = msg.message?.conversation || 
                               msg.message?.extendedTextMessage?.text || 
                               msg.message?.imageMessage?.caption || 
                               msg.message?.videoMessage?.caption || '';

            if (!messageText) return;

            // Check for bad words
            const { found, word } = containsBadWords(messageText);
            if (!found) return;

            const sender = msg.key.participant || msg.key.remoteJid;

            // Check if sender is admin
            const groupMetadata = await sock.groupMetadata(from);
            const senderIsAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;

            // Skip if sender is admin
            if (senderIsAdmin) return;

            console.log(`🤬 Bad word detected from ${sender.split('@')[0]} - Word: ${word}`);

            // Delete message
            await sock.sendMessage(from, { delete: msg.key });
            
            // Send warning
            await sock.sendMessage(from, {
                text: `⚠️ *Bad language detected!*\n\n` +
                    `👤 @${sender.split('@')[0]}\n` +
                    `🚫 Please keep the chat clean!\n` +
                    `⚡ Message deleted`,
                mentions: [sender]
            });

        } catch (error) {
            console.error('❌ Antiswear handler error:', error);
        }
    }
};