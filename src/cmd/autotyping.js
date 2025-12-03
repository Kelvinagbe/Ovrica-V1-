// commands/autotyping.js

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'autotyping',
    admin: true,
    description: 'Toggle auto typing',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        if (args.length === 0 || !['on', 'off'].includes(args[0].toLowerCase())) {
            const text = '❌ *Invalid Usage*\n\n' +
                        'Usage: /autotyping <on/off>\n\n' +
                        'Example: /autotyping on';
            return await sendWithTyping(sock, from, { text });
        }

        const status = args[0].toLowerCase() === 'on';

        // Update config file
        const configPath = path.join(__dirname, '../../config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        configContent = configContent.replace(
            /autoTyping:\s*(true|false)/,
            `autoTyping: ${status}`
        );
        fs.writeFileSync(configPath, configContent);

        // Update runtime config
        delete require.cache[require.resolve('../../config')];
        const CONFIG = require('../../config');
        CONFIG.autoTyping = status;

        const text = '┌ ❏ *⌜ SETTING UPDATED ⌟* ❏\n' +
                    '│\n' +
                    '├◆ 📋 AUTO TYPING\n' +
                    `├◆ ${status ? '✅ Enabled' : '❌ Disabled'}\n` +
                    '│\n' +
                    `├◆ Auto typing will now be ${status ? 'shown' : 'hidden'} when bot responds.\n` +
                    '│\n' +
                    '└ ❏\n' +
                    '> 🎭OVRICA-V1🎭';

        await sendWithTyping(sock, from, { text });
    }
};
