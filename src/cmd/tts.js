// commands/tts.js - Text to Speech (Same format as song.js)
// Install: npm install axios gtts

const axios = require('axios');
const gtts = require('gtts');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tts',
    admin: false,
    description: 'Convert text to speech',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ TEXT TO SPEECH ⌟* ❏\n│\n` +
                        `├◆ 🔊 *Convert text to voice*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n│\n` +
                        `├◆ 📝 /tts [language] [text]\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜LANGUAGES⌟* ◆\n│\n` +
                        `├◆ en = English\n` +
                        `├◆ es = Spanish\n` +
                        `├◆ fr = French\n` +
                        `├◆ de = German\n` +
                        `├◆ it = Italian\n` +
                        `├◆ ja = Japanese\n` +
                        `├◆ ko = Korean\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /tts en Hello world\n` +
                        `├◆ /tts es Hola mundo\n` +
                        `├◆ /tts ja こんにちは\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            let language = 'en';
            let text;

            // Check if first arg is a language code
            if (args[0].length === 2) {
                language = args[0];
                text = args.slice(1).join(' ');
            } else {
                text = args.join(' ');
            }

            if (!text || text.trim() === '') {
                return await sock.sendMessage(from, {
                    text: `❌ *No text provided!*\n\n📝 Usage: /tts [language] [text]`
                }, { quoted: msg });
            }

            const processingMsg = await sock.sendMessage(from, {
                text: `🔊 *Generating speech...*\n\n📝 Text: ${text}\n🌍 Language: ${language}\n\n⏳ Please wait...`
            }, { quoted: msg });

            await generateSpeech(sock, from, msg, text, language, processingMsg);

        } catch (error) {
            console.error('❌ TTS error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *TTS failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n│\n` +
                    `├◆ 💡 Try again\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};

async function generateSpeech(sock, from, msg, text, language, processingMsg) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const audioPath = path.join(tempDir, `tts_${Date.now()}.mp3`);

    try {
        // Method 1: Using gtts library (Most Reliable)
        const tts = new gtts(text, language);
        
        await new Promise((resolve, reject) => {
            tts.save(audioPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (!fs.existsSync(audioPath)) {
            throw new Error('Audio file not created');
        }

        const audioBuffer = fs.readFileSync(audioPath);
        const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);

        // Send audio as voice note
        await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: true, // Voice note
            fileName: `tts_${Date.now()}.mp3`
        });

        // Update processing message
        await sock.sendMessage(from, {
            text: `✅ *Speech generated!*\n\n📝 Text: ${text}\n🌍 Language: ${language}\n📦 Size: ${fileSizeMB} MB`,
            edit: processingMsg.key
        });

        // Cleanup
        fs.unlinkSync(audioPath);

    } catch (error) {
        console.error('❌ TTS generation error:', error);

        // Cleanup on error
        if (fs.existsSync(audioPath)) {
            try { fs.unlinkSync(audioPath); } catch {}
        }

        // Fallback: Try Google TTS API
        try {
            const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(text)}`;
            
            const response = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            await sock.sendMessage(from, {
                audio: Buffer.from(response.data),
                mimetype: 'audio/mpeg',
                ptt: true
            });

            await sock.sendMessage(from, {
                text: `✅ *Speech generated!*\n\n📝 Text: ${text}\n🌍 Language: ${language}\n🔧 Method: Google TTS`,
                edit: processingMsg.key
            });

        } catch (fallbackError) {
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *TTS failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n` +
                    `├◆ 💡 *Solution:* Try shorter text or different language\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`,
                edit: processingMsg.key
            });
        }
    }
}