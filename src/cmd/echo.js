// commands/echo.js

const { templates } = require('../tmp/templates');

module.exports = {

    name: 'echo',

    admin: false,

    description: 'Echo your message',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        if (args.length === 0) {

            const text = templates.error('Usage: /echo <text>\n\nExample: /echo Hello World');

            return await sendWithTyping(sock, from, { text });

        }

        const text = templates.simpleText.echo(args.join(' '));

        await sendWithTyping(sock, from, { text });

    }

};