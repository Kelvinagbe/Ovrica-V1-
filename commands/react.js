// commands/autoreact.js - Advanced auto-react command with emoji customization
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'react',
    description: 'Control auto-react feature with custom emojis',
    admin: false,

    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            const settingsPath = path.join(process.cwd(), 'settings.json');
            
            // Load current settings
            let settings = {};
            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            } else {
                settings = {
                    botMode: 'public',
                    autoTyping: true,
                    autoViewStatus: true,
                    alwaysOnline: true,
                    autoReact: false,
                    sendWelcome: false,
                    logMessages: false,
                    logCommands: false,
                    logErrors: true,
                    reactEmojis: ['❤️', '👍', '🔥', '😂', '😮', '👏', '✨', '🎉'],
                    reactChance: 0.3
                };
            }

            const action = args[0]?.toLowerCase();

            // Show help if no arguments
            if (!action) {
                const status = settings.autoReact ? '✅ ON' : '❌ OFF';
                const emojis = settings.reactEmojis?.join(' ') || '❤️ 👍 🔥 😂 😮 👏 ✨ 🎉';
                const chance = Math.round((settings.reactChance || 0.3) * 100);

                const helpMessage = `┌ ❏ *⌜ AUTO REACT CONTROL ⌟* ❏
│
├◆ 🎭 Status: ${status}
├◆ 🎯 Chance: ${chance}%
├◆ 🎨 Emojis: ${emojis}
│
├◆ 📝 *Commands:*
├◆ /autoreact on - Enable
├◆ /autoreact off - Disable
├◆ /autoreact chance <1-100> - Set %
├◆ /autoreact emojis <emoji list> - Set emojis
├◆ /autoreact reset - Reset to defaults
├◆ /autoreact test - Test reaction
│
├◆ 💡 *Examples:*
├◆ /autoreact chance 50
├◆ /autoreact emojis ❤️ 🔥 😂 ✨
│
└ ❏

> 🎭 Auto React System`;

                return await sock.sendMessage(from, { text: helpMessage }, { quoted: msg });
            }

            // Handle commands
            switch (action) {
                case 'on':
                case 'enable':
                case '1':
                    settings.autoReact = true;
                    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                    
                    await sock.sendMessage(from, {
                        text: `✅ *Auto React Enabled!*\n\nBot will now react to messages with ${Math.round((settings.reactChance || 0.3) * 100)}% chance! 🎭`
                    }, { quoted: msg });
                    break;

                case 'off':
                case 'disable':
                case '0':
                    settings.autoReact = false;
                    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                    
                    await sock.sendMessage(from, {
                        text: `❌ *Auto React Disabled!*\n\nBot will no longer react to messages automatically.`
                    }, { quoted: msg });
                    break;

                case 'chance':
                case 'percent':
                    const percentage = parseInt(args[1]);
                    
                    if (isNaN(percentage) || percentage < 1 || percentage > 100) {
                        return await sock.sendMessage(from, {
                            text: `❌ Invalid percentage!\n\nUse a number between 1-100.\nExample: /autoreact chance 50`
                        }, { quoted: msg });
                    }
                    
                    settings.reactChance = percentage / 100;
                    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                    
                    await sock.sendMessage(from, {
                        text: `✅ *Reaction Chance Updated!*\n\nNew chance: ${percentage}%\n\nBot will react to approximately ${percentage} out of 100 messages.`
                    }, { quoted: msg });
                    break;

                case 'emojis':
                case 'emoji':
                    const emojis = args.slice(1);
                    
                    if (emojis.length === 0) {
                        return await sock.sendMessage(from, {
                            text: `❌ No emojis provided!\n\nExample: /autoreact emojis ❤️ 🔥 😂 ✨ 👍`
                        }, { quoted: msg });
                    }
                    
                    settings.reactEmojis = emojis;
                    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                    
                    await sock.sendMessage(from, {
                        text: `✅ *Reaction Emojis Updated!*\n\nNew emojis: ${emojis.join(' ')}\n\nBot will now use these emojis for reactions!`
                    }, { quoted: msg });
                    break;

                case 'reset':
                    settings.autoReact = false;
                    settings.reactEmojis = ['❤️', '👍', '🔥', '😂', '😮', '👏', '✨', '🎉'];
                    settings.reactChance = 0.3;
                    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                    
                    await sock.sendMessage(from, {
                        text: `🔄 *Auto React Reset!*\n\n✅ Status: OFF\n✅ Chance: 30%\n✅ Emojis: ❤️ 👍 🔥 😂 😮 👏 ✨ 🎉\n\nAll settings restored to default!`
                    }, { quoted: msg });
                    break;

                case 'test':
                    const testEmojis = settings.reactEmojis || ['❤️', '👍', '🔥', '😂', '😮', '👏', '✨', '🎉'];
                    const randomEmoji = testEmojis[Math.floor(Math.random() * testEmojis.length)];
                    
                    await sock.sendMessage(from, {
                        react: { text: randomEmoji, key: msg.key }
                    });
                    
                    await sock.sendMessage(from, {
                        text: `🧪 *Test Reaction Sent!*\n\nEmoji: ${randomEmoji}\nFrom pool: ${testEmojis.join(' ')}`
                    }, { quoted: msg });
                    break;

                case 'status':
                    const statusEmoji = settings.autoReact ? '✅' : '❌';
                    const statusText = settings.autoReact ? 'Enabled' : 'Disabled';
                    const currentEmojis = settings.reactEmojis?.join(' ') || '❤️ 👍 🔥 😂 😮 👏 ✨ 🎉';
                    const currentChance = Math.round((settings.reactChance || 0.3) * 100);

                    await sock.sendMessage(from, {
                        text: `┌ ❏ *⌜ AUTO REACT STATUS ⌟* ❏
│
├◆ ${statusEmoji} Status: ${statusText}
├◆ 🎯 Chance: ${currentChance}%
├◆ 🎨 Emojis: ${currentEmojis}
├◆ 📊 Pool Size: ${settings.reactEmojis?.length || 8} emojis
│
└ ❏`
                    }, { quoted: msg });
                    break;

                default:
                    await sock.sendMessage(from, {
                        text: `❌ Unknown command: ${action}\n\nUse /autoreact to see all available commands.`
                    }, { quoted: msg });
            }

            // Update CONFIG in memory if possible
            try {
                const CONFIG = require('../config');
                CONFIG.autoReact = settings.autoReact;
                CONFIG.reactEmojis = settings.reactEmojis;
            } catch (error) {
                console.log('⚠️ Could not update CONFIG in memory');
            }

            console.log(`🎭 AutoReact ${action} executed`);

        } catch (error) {
            console.error('❌ AutoReact command error:', error);
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};