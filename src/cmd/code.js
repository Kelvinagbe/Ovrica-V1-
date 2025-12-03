module.exports.code = {
    name: 'code',
    exec: async (sock, from, args, msg) => {
        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: `Usage: /code [your coding question]\n\nExample: /code write a function to reverse a string in javascript`
            }, { quoted: msg });
        }

        const prompt = args.join(' ');
        
        await sock.sendMessage(from, {
            text: `💻 Generating code...\n\n⏳ Please wait...`
        }, { quoted: msg });

        try {
            // Method 1: Phind (Code-specialized AI)
            const response = await axios.post('https://https.extension.phind.com/agent/', {
                question: prompt,
                mode: 'concise'
            }, {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const answer = response.data?.answer || response.data?.result;
            
            if (!answer) throw new Error('No response');

            await sock.sendMessage(from, {
                text: `\`\`\`\n${answer}\n\`\`\`\n\n> 💻 Phind AI`
            }, { quoted: msg });

        } catch (error) {
            // Fallback: OpenAI GPT via free proxy
            try {
                const fallbackResponse = await axios.post('https://api.pawan.krd/v1/chat/completions', {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a helpful coding assistant.' },
                        { role: 'user', content: prompt }
                    ]
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const answer = fallbackResponse.data.choices[0].message.content;
                
                await sock.sendMessage(from, {
                    text: `\`\`\`\n${answer}\n\`\`\`\n\n> 💻 GPT-3.5`
                }, { quoted: msg });

            } catch (err) {
                await sock.sendMessage(from, {
                    text: `❌ Code AI temporarily unavailable. Try again later.`
                }, { quoted: msg });
            }
        }
    }
};