// commands/alwaysonline.js

const { templates } = require('../templates');

const fs = require('fs');

const path = require('path');

module.exports = {

    name: 'alwaysonline',

    admin: true,

    description: 'Toggle always online',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        if (args.length === 0 || !['on', 'off'].includes(args[0].toLowerCase())) {

            const text = templates.error('Usage: /alwaysonline <on/off>\n\nExample: /alwaysonline on');

            return await sendWithTyping(sock, from, { text });

        }

        

        const status = args[0].toLowerCase() === 'on';

        

        // Update config file

        const configPath = path.join(__dirname, '../config.js');

        let configContent = fs.readFileSync(configPath, 'utf8');

        configContent = configContent.replace(

            /alwaysOnline:\s*(true|false)/,

            `alwaysOnline: ${status}`

        );

        fs.writeFileSync(configPath, configContent);

        

        // Update runtime config

        delete require.cache[require.resolve('../config')];

        const CONFIG = require('../config');

        CONFIG.alwaysOnline = status;

        

        // Apply status

        if (status) {

            await sock.sendPresenceUpdate('available');

        }

        

        const sections = [{

            title: 'ALWAYS ONLINE',

            items: [

                `Status: ${status ? '✅ Enabled' : '❌ Disabled'}`,

                '',

                'Bot will now appear ' + (status ? 'always online' : 'with normal status') + '.'

            ]

        }];

        

        const text = require('../templates').design.buildSimple('SETTING UPDATED', sections);

        await sendWithTyping(sock, from, { text });

    }

};