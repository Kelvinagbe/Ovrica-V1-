// commands/autotyping.js

const { templates } = require('../tmp/templates');

const fs = require('fs');

const path = require('path');

module.exports = {

    name: 'autotyping',

    admin: true,

    description: 'Toggle auto typing',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        if (args.length === 0 || !['on', 'off'].includes(args[0].toLowerCase())) {

            const text = templates.error('Usage: /autotyping <on/off>\n\nExample: /autotyping on');

            return await sendWithTyping(sock, from, { text });

        }

        

        const status = args[0].toLowerCase() === 'on';

        

        // Update config file

        const configPath = path.join(__dirname, '../config.js');

        let configContent = fs.readFileSync(configPath, 'utf8');

        configContent = configContent.replace(

            /autoTyping:\s*(true|false)/,

            `autoTyping: ${status}`

        );

        fs.writeFileSync(configPath, configContent);

        

        // Update runtime config

        delete require.cache[require.resolve('../config')];

        const CONFIG = require('@/config');

        CONFIG.autoTyping = status;

        

        const sections = [{

            title: 'AUTO TYPING',

            items: [

                `Status: ${status ? '✅ Enabled' : '❌ Disabled'}`,

                '',

                'Auto typing will now be ' + (status ? 'shown' : 'hidden') + ' when bot responds.'

            ]

        }];

        

        const text = require('../HTML/templates').design.buildSimple('SETTING UPDATED', sections);

        await sendWithTyping(sock, from, { text });

    }

};