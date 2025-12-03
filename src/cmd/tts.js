module.exports.tts = {
    name: 'tts',
    exec: async (sock, from, args, msg) => {
        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: `Usage: /tts [text]\n\nExample: /tts Hello world`
            }, { quoted: msg });
        }

        const text = args.join(' ');
        
        try {
            // Google TTS (Always works, no API key)
            const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;
            
            const response = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            await sock.sendMessage(from, {
                audio: Buffer.from(response.data),
                mimetype: 'audio/mpeg',
                ptt: true // Voice note
            }, { quoted: msg });

        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ TTS failed: ${error.message}`
            }, { quoted: msg });
        }
    }
};