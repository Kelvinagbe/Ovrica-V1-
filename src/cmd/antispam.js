// commands/antispam.js - Anti-Spam Protection (COMPLETE)
// No external dependencies needed

const fs = require('fs');
const path = require('path');

// Store antispam settings
const settingsPath = path.join(__dirname, '../data/antispam.json');
const spamDataPath = path.join(__dirname, '../data/spamdata.json');

// Spam tracking
let spamUsers = [];

// Initialize settings file
function initSettings() {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(settingsPath)) {
        const defaultSettings = {
            groups: {},
            maxMessages: 5,
            timeWindow: 10000, // 10 seconds
            action: 'warn'
        };
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    }
    if (!fs.existsSync(spamDataPath)) {
        fs.writeFileSync(spamDataPath, JSON.stringify([]));
    }
}

// Load settings
function loadSettings() {
    initSettings();
    try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
        return { groups: {}, maxMessages: 5, timeWindow: 10000, action: 'warn' };
    }
}

// Save settings
function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Load spam data
function loadSpamData() {
    try {
        return JSON.parse(fs.readFileSync(spamDataPath, 'utf-8'));
    } catch {
        return [];
    }
}

// Save spam data
function saveSpamData(data) {
    fs.writeFileSync(spamDataPath, JSON.stringify(data, null, 2));
}

// Check if antispam is enabled for group
function isEnabled(groupId) {
    const settings = loadSettings();
    return settings.groups[groupId]?.enabled || false;
}

// Enable/disable antispam
function setEnabled(groupId, enabled) {
    const settings = loadSettings();
    if (!settings.groups[groupId]) {
        settings.groups[groupId] = { enabled: false, action: 'warn' };
    }
    settings.groups[groupId].enabled = enabled;
    saveSettings(settings);
}

// Set action (warn, mute, kick)
function setAction(groupId, action) {
    const settings = loadSettings();
    if (!settings.groups[groupId]) {
        settings.groups[groupId] = { enabled: false, action: 'warn' };
    }
    settings.groups[groupId].action = action;
    saveSettings(settings);
}

// Get group action
function getAction(groupId) {
    const settings = loadSettings();
    return settings.groups[groupId]?.action || settings.action || 'warn';
}

// Add spam entry
function addSpam(sender, groupId) {
    let position = false;
    
    spamUsers.forEach((user, i) => {
        if (user.id === sender && user.group === groupId) {
            position = i;
        }
    });

    if (position !== false) {
        spamUsers[position].count += 1;
        spamUsers[position].lastMessage = Date.now();
    } else {
        spamUsers.push({
            id: sender,
            group: groupId,
            count: 1,
            lastMessage: Date.now(),
            expired: Date.now() + 10000 // 10 seconds
        });
    }
    
    saveSpamData(spamUsers);
}

// Check if user is spamming
function isSpam(sender, groupId) {
    const settings = loadSettings();
    const maxMessages = settings.maxMessages || 5;
    
    for (let user of spamUsers) {
        if (user.id === sender && user.group === groupId) {
            if (user.count >= maxMessages) {
                return true;
            }
        }
    }
    return false;
}

// Reset spam data periodically
function resetSpam() {
    setInterval(() => {
        const now = Date.now();
        spamUsers = spamUsers.filter(user => now < user.expired);
        saveSpamData(spamUsers);
    }, 1000);
}

// Get user spam count
function getSpamCount(sender, groupId) {
    for (let user of spamUsers) {
        if (user.id === sender && user.group === groupId) {
            return user.count;
        }
    }
    return 0;
}

// Clear user spam
function clearSpam(sender, groupId) {
    spamUsers = spamUsers.filter(user => !(user.id === sender && user.group === groupId));
    saveSpamData(spamUsers);
}

// Initialize spam tracking
spamUsers = loadSpamData();
resetSpam();

module.exports = {
    name: 'antispam',
    alias: ['antspam'],
    admin: false,
    description: 'Protect group from spam messages',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            console.log('📨 Antispam command executed');

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
            const param = args[1];

            // Show status if no action
            if (!action) {
                const settings = loadSettings();
                const groupSettings = settings.groups[from] || { enabled: false, action: 'warn' };
                const maxMessages = settings.maxMessages || 5;
                const timeWindow = (settings.timeWindow || 10000) / 1000;

                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ANTI-SPAM ⌟* ❏\n│\n` +
                        `├◆ 📨 *Spam Protection System*\n` +
                        `├◆ 📊 *Status:* ${groupSettings.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                        `├◆ ⚡ *Action:* ${groupSettings.action}\n` +
                        `├◆ 📝 *Limit:* ${maxMessages} messages / ${timeWindow}s\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜COMMANDS⌟* ◆\n│\n` +
                        `├◆ /antispam on - Enable protection\n` +
                        `├◆ /antispam off - Disable protection\n` +
                        `├◆ /antispam warn - Warn spammers\n` +
                        `├◆ /antispam mute - Mute spammers\n` +
                        `├◆ /antispam kick - Kick spammers\n` +
                        `├◆ /antispam limit <num> - Set message limit\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            // Handle actions
            switch (action) {
                case 'on':
                case 'enable':
                    setEnabled(from, true);
                    await sock.sendMessage(from, {
                        text: `✅ *Anti-spam enabled!*\n\n` +
                            `📨 Spam messages will be detected\n` +
                            `⚠️ Admins are exempt from filtering`
                    }, { quoted: msg });
                    break;

                case 'off':
                case 'disable':
                    setEnabled(from, false);
                    await sock.sendMessage(from, {
                        text: `❌ *Anti-spam disabled!*\n\n` +
                            `📨 Spam detection is now off`
                    }, { quoted: msg });
                    break;

                case 'warn':
                case 'mute':
                case 'kick':
                    setAction(from, action);
                    await sock.sendMessage(from, {
                        text: `✅ *Action set to: ${action}*\n\n` +
                            `📨 Spammers will be: ${action === 'warn' ? 'warned' : action === 'mute' ? 'muted' : 'kicked'}`
                    }, { quoted: msg });
                    break;

                case 'limit':
                    if (!param || isNaN(param)) {
                        return await sock.sendMessage(from, {
                            text: `❌ *Invalid limit!*\n\n` +
                                `📝 Usage: /antispam limit <number>\n` +
                                `Example: /antispam limit 5`
                        }, { quoted: msg });
                    }
                    const settings = loadSettings();
                    settings.maxMessages = parseInt(param);
                    saveSettings(settings);
                    await sock.sendMessage(from, {
                        text: `✅ *Spam limit updated!*\n\n` +
                            `📝 New limit: ${param} messages / 10 seconds`
                    }, { quoted: msg });
                    break;

                default:
                    await sock.sendMessage(from, {
                        text: `❌ *Invalid action!*\n\n` +
                            `📝 Valid actions:\n` +
                            `• on/off\n` +
                            `• warn/mute/kick\n` +
                            `• limit <number>`
                    }, { quoted: msg });
            }

        } catch (error) {
            console.error('❌ Antispam error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *Command failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    },

    // Message handler for checking spam
    handleMessage: async (sock, msg) => {
        try {
            const from = msg.key.remoteJid;
            
            // Only check groups
            if (!from.endsWith('@g.us')) return;

            // Check if antispam is enabled
            if (!isEnabled(from)) return;

            const sender = msg.key.participant || msg.key.remoteJid;

            // Check if sender is admin
            const groupMetadata = await sock.groupMetadata(from);
            const senderIsAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;

            // Skip if sender is admin
            if (senderIsAdmin) return;

            // Add spam entry
            addSpam(sender, from);

            // Check if spamming
            if (isSpam(sender, from)) {
                const action = getAction(from);
                const count = getSpamCount(sender, from);

                console.log(`📨 Spam detected from ${sender.split('@')[0]} - Count: ${count} - Action: ${action}`);

                // Perform action
                switch (action) {
                    case 'warn':
                        await sock.sendMessage(from, {
                            text: `⚠️ *SPAM DETECTED!*\n\n` +
                                `👤 @${sender.split('@')[0]}\n` +
                                `📨 You're sending messages too fast!\n` +
                                `⏸️ Please slow down\n` +
                                `⚡ Continued spam = removal`,
                            mentions: [sender]
                        });
                        break;

                    case 'mute':
                        // Mute for 5 minutes
                        await sock.groupParticipantsUpdate(from, [sender], 'demote');
                        await sock.sendMessage(from, {
                            text: `🔇 *User muted for spam!*\n\n` +
                                `👤 @${sender.split('@')[0]}\n` +
                                `⏱️ Duration: 5 minutes\n` +
                                `📨 Reason: Excessive messaging`,
                            mentions: [sender]
                        });
                        
                        // Unmute after 5 minutes
                        setTimeout(async () => {
                            try {
                                await sock.groupParticipantsUpdate(from, [sender], 'promote');
                            } catch (e) {
                                console.error('Failed to unmute:', e);
                            }
                        }, 300000);
                        break;

                    case 'kick':
                        await sock.groupParticipantsUpdate(from, [sender], 'remove');
                        await sock.sendMessage(from, {
                            text: `🚫 *Removed for spam!*\n\n` +
                                `👤 @${sender.split('@')[0]}\n` +
                                `📨 Excessive messaging detected`,
                            mentions: [sender]
                        });
                        break;
                }

                // Clear spam after action
                clearSpam(sender, from);
            }

        } catch (error) {
            console.error('❌ Antispam handler error:', error);
        }
    },

    // Export utility functions
    utils: {
        addSpam,
        isSpam,
        resetSpam,
        clearSpam,
        getSpamCount
    }
};