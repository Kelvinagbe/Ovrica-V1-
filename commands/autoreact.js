// commands/autoreact.js

const { templates } = require('../templates');

const fs = require('fs');

const path = require('path');

module.exports = {

    name: 'autoreact',

    admin: true,

    description: 'Toggle auto react',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        if (args.length === 0 || !['on', 'off'].includes(args[0].toLowerCase())) {

            const text = templates.error('Usage: /autoreact <on/off>\n\nExample: /autoreact on');

            return await sendWithTyping(sock, from, { text });

        }

        

        const status = args[0].toLowerCase() === 'on';

        

        // Update config file

        const configPath = path.join(__dirname, '../config.js');

        let configContent = fs.readFileSync(configPath, 'utf8');

        configContent = configContent.replace(

            /autoReact:\s*(true|false)/,

            `autoReact: ${status}`

        );

        fs.writeFileSync(configPath, configContent);

        

        // Update runtime config

        delete require.cache[require.resolve('../config')];

        const CONFIG = require('../config');

        CONFIG.autoReact = status;

        

        const sections = [{

            title: 'AUTO REACT',

            items: [

                `Status: ${status ? '✅ Enabled' : '❌ Disabled'}`,

                '',

                'Bot will now ' + (status ? 'automatically react' : 'not react') + ' to messages.',

                status ? `Reactions: ${CONFIG.reactEmojis.join(', ')}` : ''

            ]

        }];

        

        const text = require('../templates').design.buildSimple('SETTING UPDATED', sections);

        await sendWithTyping(sock, from, { text });

    }

};