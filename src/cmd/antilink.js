// commands/antilink.js - Anti-Link Protection (COMPLETE)
// No external dependencies needed

const fs = require('fs');
const path = require('path');

// Store antilink settings
const settingsPath = path.join(__dirname, '@/data/antilink.json');

// Initialize settings file
function initSettings() {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(settingsPath)) {
        fs.writeFileSync(settingsPath, JSON.stringify({}));
    }
}

// Load settings
function loadSettings() {
    initSettings();
    try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
        return {};
    }
}

// Save settings
function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Check if antilink is enabled for group
function isEnabled(groupId) {
    const settings = loadSettings();
    return settings[groupId]?.enabled || false;
}

// Enable/disable antilink
function setEnabled(groupId, enabled) {
    const settings = loadSettings();
    if (!settings[groupId]) {
        settings[groupId] = { enabled: false, action: 'delete', whitelist: [] };
    }
    settings[groupId].enabled = enabled;
    saveSettings(settings);
}

// Set action (delete, warn, kick)
function setAction(groupId, action) {
    const settings = loadSettings();
    if (!settings[groupId]) {
        settings[groupId] = { enabled: false, action: 'delete', whitelist: [] };
    }
    settings[groupId].action = action;
    saveSettings(settings);
}

// Add to whitelist
function addWhitelist(groupId, userId) {
    const settings = loadSettings();
    if (!settings[groupId]) {
        settings[groupId] = { enabled: false, action: 'delete', whitelist: [] };
    }
    if (!settings[groupId].whitelist.includes(userId)) {
        settings[groupId].whitelist.push(userId);
        saveSettings(settings);
        return true;
    }
    return false;
}

// Remove from whitelist
function removeWhitelist(groupId, userId) {
    const settings = loadSettings();
    if (settings[groupId]?.whitelist) {
        const index = settings[groupId].whitelist.indexOf(userId);
        if (index > -1) {
            settings[groupId].whitelist.splice(index, 1);
            saveSettings(settings);
            return true;
        }
    }
    return false;
}

// Check if user is whitelisted
function isWhitelisted(groupId, userId) {
    const settings = loadSettings();
    return settings[groupId]?.whitelist?.includes(userId) || false;
}

module.exports = {
    name: 'antilink',
    alias: ['antlink'],
    admin: false,
    description: 'Protect group from unwanted links',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            console.log('🔗 Antilink command executed');

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

            // Show status if no action
            if (!action) {
                const settings = loadSettings();
                const groupSettings = settings[from] || { enabled: false, action: 'delete', whitelist: [] };

                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ANTI-LINK ⌟* ❏\n│\n` +
                        `├◆ 🔗 *Group Link Protection*\n` +
                        `├◆ 📊 *Status:* ${groupSettings.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                        `├◆ ⚡ *Action:* ${groupSettings.action}\n` +
                        `├◆ 👥 *Whitelisted:* ${groupSettings.whitelist.length}\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜COMMANDS⌟* ◆\n│\n` +
                        `├◆ /antilink on - Enable\n` +
                        `├◆ /antilink off - Disable\n` +
                        `├◆ /antilink delete - Delete messages\n` +
                        `├◆ /antilink warn - Warn users\n` +
                        `├◆ /antilink kick - Kick users\n` +
                        `├◆ /antilink whitelist @user - Add exception\n` +
                        `├◆ /antilink unwhitelist @user - Remove exception\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            // Handle actions
            switch (action) {
                case 'on':
                case 'enable':
                    setEnabled(from, true);
                    await sock.sendMessage(from, {
                        text: `✅ *Anti-link enabled!*\n\n` +
                            `🔗 Links will be automatically deleted\n` +
                            `⚠️ Admins and whitelisted users are exempt`
                    }, { quoted: msg });
                    break;

                case 'off':
                case 'disable':
                    setEnabled(from, false);
                    await sock.sendMessage(from, {
                        text: `❌ *Anti-link disabled!*\n\n` +
                            `🔗 Links are now allowed`
                    }, { quoted: msg });
                    break;

                case 'delete':
                case 'warn':
                case 'kick':
                    setAction(from, action);
                    await sock.sendMessage(from, {
                        text: `✅ *Action set to: ${action}*\n\n` +
                            `🔗 Links will trigger: ${action} action`
                    }, { quoted: msg });
                    break;

                case 'whitelist':
                    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    if (mentionedJid.length === 0) {
                        return await sock.sendMessage(from, {
                            text: `❌ *Please mention a user!*\n\n` +
                                `📝 Usage: /antilink whitelist @user`
                        }, { quoted: msg });
                    }
                    const addedUser = mentionedJid[0];
                    if (addWhitelist(from, addedUser)) {
                        await sock.sendMessage(from, {
                            text: `✅ *User whitelisted!*\n\n` +
                                `👤 @${addedUser.split('@')[0]} can now send links`,
                            mentions: [addedUser]
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, {
                            text: `⚠️ *User already whitelisted!*`
                        }, { quoted: msg });
                    }
                    break;

                case 'unwhitelist':
                    const unwhitelistJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    if (unwhitelistJid.length === 0) {
                        return await sock.sendMessage(from, {
                            text: `❌ *Please mention a user!*\n\n` +
                                `📝 Usage: /antilink unwhitelist @user`
                        }, { quoted: msg });
                    }
                    const removedUser = unwhitelistJid[0];
                    if (removeWhitelist(from, removedUser)) {
                        await sock.sendMessage(from, {
                            text: `✅ *User removed from whitelist!*\n\n` +
                                `👤 @${removedUser.split('@')[0]} can no longer send links`,
                            mentions: [removedUser]
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, {
                            text: `⚠️ *User not in whitelist!*`
                        }, { quoted: msg });
                    }
                    break;

                default:
                    await sock.sendMessage(from, {
                        text: `❌ *Invalid action!*\n\n` +
                            `📝 Valid actions:\n` +
                            `• on/off\n` +
                            `• delete/warn/kick\n` +
                            `• whitelist/unwhitelist`
                    }, { quoted: msg });
            }

        } catch (error) {
            console.error('❌ Antilink error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *Command failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    },

    // Message handler for checking links
    handleMessage: async (sock, msg) => {
        try {
            const from = msg.key.remoteJid;
            
            // Only check groups
            if (!from.endsWith('@g.us')) return;

            // Check if antilink is enabled
            if (!isEnabled(from)) return;

            // Get message text
            const messageText = msg.message?.conversation || 
                               msg.message?.extendedTextMessage?.text || 
                               msg.message?.imageMessage?.caption || 
                               msg.message?.videoMessage?.caption || '';

            // Check for links
            const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|co|app|xyz|tv|me|in|uk|us)[^\s]*)/gi;
            const whatsappGroupRegex = /(https?:\/\/)?(chat\.whatsapp\.com|wa\.me)\/[^\s]+/gi;

            if (!linkRegex.test(messageText) && !whatsappGroupRegex.test(messageText)) return;

            const sender = msg.key.participant || msg.key.remoteJid;

            // Check if sender is admin
            const groupMetadata = await sock.groupMetadata(from);
            const senderIsAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;

            // Skip if sender is admin or whitelisted
            if (senderIsAdmin || isWhitelisted(from, sender)) return;

            const settings = loadSettings();
            const action = settings[from]?.action || 'delete';

            console.log(`🔗 Link detected from ${sender.split('@')[0]} - Action: ${action}`);

            // Perform action
            switch (action) {
                case 'delete':
                    // Delete message first
                    await sock.sendMessage(from, { delete: msg.key });
                    
                    // Send single notification
                    await sock.sendMessage(from, {
                        text: `⚠️ Link deleted from @${sender.split('@')[0]}`,
                        mentions: [sender]
                    });
                    break;

                case 'warn':
                    // Delete message first
                    await sock.sendMessage(from, { delete: msg.key });
                    
                    // Send warning
                    await sock.sendMessage(from, {
                        text: `⚠️ *WARNING!*\n\n` +
                            `👤 @${sender.split('@')[0]}\n` +
                            `🔗 Links are not allowed!\n` +
                            `⚡ Next violation = removal`,
                        mentions: [sender]
                    });
                    break;

                case 'kick':
                    // Delete message first
                    await sock.sendMessage(from, { delete: msg.key });
                    
                    // Kick user
                    await sock.groupParticipantsUpdate(from, [sender], 'remove');
                    
                    // Send notification
                    await sock.sendMessage(from, {
                        text: `🚫 Removed @${sender.split('@')[0]} for sharing links`,
                        mentions: [sender]
                    });
                    break;
            }

        } catch (error) {
            console.error('❌ Antilink handler error:', error);
        }
    }
};