const { loadJSON, saveJSON } = require('../utils/db-loader');

module.exports = {
    name: 'settings',
    alias: ['config', 'botsettings'],
    owner: true,
    description: 'Manage bot settings',

    exec: async (sock, from, args, msg) => {
        try {
            const action = args[0]?.toLowerCase();
            const value = args[1]?.toLowerCase();

            const data = loadJSON('settings.json', {});

            // Show current settings
            if (!action) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ BOT SETTINGS ⌟* ❏\n│\n` +
                        `├◆ 🤖 Mode: ${data.botMode}\n` +
                        `├◆ ⌨️ Auto Typing: ${data.autoTyping ? 'ON' : 'OFF'}\n` +
                        `├◆ 👁️ View Status: ${data.autoViewStatus ? 'ON' : 'OFF'}\n` +
                        `├◆ 🟢 Always Online: ${data.alwaysOnline ? 'ON' : 'OFF'}\n` +
                        `├◆ ❤️ Auto React: ${data.autoReact ? 'ON' : 'OFF'}\n` +
                        `├◆ 👋 Send Welcome: ${data.sendWelcome ? 'ON' : 'OFF'}\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ *⌜ COMMANDS ⌟* ❏\n│\n` +
                        `├◆ /settings autotyping on/off\n` +
                        `├◆ /settings autoreact on/off\n` +
                        `├◆ /settings mode public/private\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            // Update setting
            const validSettings = ['autotyping', 'autoreact', 'viewstatus', 'alwaysonline', 'welcome', 'mode'];
            
            if (!validSettings.includes(action)) {
                return await sock.sendMessage(from, {
                    text: `❌ Invalid setting!\n\nValid: ${validSettings.join(', ')}`
                }, { quoted: msg });
            }

            if (action === 'mode') {
                if (!['public', 'private'].includes(value)) {
                    return await sock.sendMessage(from, {
                        text: `❌ Mode must be 'public' or 'private'`
                    }, { quoted: msg });
                }
                data.botMode = value;
            } else {
                const isOn = value === 'on' || value === 'true';
                const settingMap = {
                    'autotyping': 'autoTyping',
                    'autoreact': 'autoReact',
                    'viewstatus': 'autoViewStatus',
                    'alwaysonline': 'alwaysOnline',
                    'welcome': 'sendWelcome'
                };
                data[settingMap[action]] = isOn;
            }

            saveJSON('settings.json', data);

            await sock.sendMessage(from, {
                text: `✅ Setting updated!\n\n${action}: ${value}`
            }, { quoted: msg });

        } catch (error) {
            console.error('Settings error:', error);
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};