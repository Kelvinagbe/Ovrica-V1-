const axios = require('axios');

module.exports = {
    name: 'code',
    admin: false,
    description: 'Generate/explain code',

    exec: async (sock, from, args, msg) => {
        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: `📝 Usage:\n\n` +
                      `/code generate [description]\n` +
                      `/code explain [code]\n` +
                      `/code debug [code]\n\n` +
                      `Example: /code generate login function in javascript`
            }, { quoted: msg });
        }

        const action = args[0];
        const query = args.slice(1).join(' ');

        await sock.sendMessage(from, {
            text: `💻 Processing...\n\n⏳ Please wait...`
        }, { quoted: msg });

        try {
            let prompt = query;
            if (action === 'generate') prompt = `Write code for: ${query}`;
            if (action === 'explain') prompt = `Explain this code: ${query}`;
            if (action === 'debug') prompt = `Debug this code and fix errors: ${query}`;

            // Use Blackbox AI (specialized for coding)
            const apis = [
                `https://api.popcat.xyz/blackbox?text=${encodeURIComponent(prompt)}`,
                `https://api.betabotz.eu.org/api/search/blackbox?text=${encodeURIComponent(prompt)}`,
                `https://widipe.com/blackbox?text=${encodeURIComponent(prompt)}`
            ];

            let result = null;
            for (const api of apis) {
                try {
                    const response = await axios.get(api, { timeout: 60000 });
                    result = response.data?.result || response.data?.response || response.data?.answer;
                    if (result) break;
                } catch (err) {
                    console.log('API failed, trying next...');
                }
            }

            if (!result) throw new Error('All code AI APIs failed');

            await sock.sendMessage(from, {
                text: `\`\`\`${result}\`\`\`\n\n> 💻 Code AI`
            }, { quoted: msg });

        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};