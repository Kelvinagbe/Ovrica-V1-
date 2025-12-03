const axios = require('axios');

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
                        `├◆ ko = Korean\n` +
                        `├◆ pcm = Nigerian Pidgin\n` +
                        `├◆ pidgin = Nigerian Pidgin\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /tts en Hello world\n` +
                        `├◆ /tts es Hola mundo\n` +
                        `├◆ /tts pcm How you dey\n` +
                        `├◆ /tts pidgin Wetin dey happen\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            // Language mapping (maps pidgin variants to English)
            const languageMap = {
                'en': 'en',
                'es': 'es',
                'fr': 'fr',
                'de': 'de',
                'it': 'it',
                'ja': 'ja',
                'ko': 'ko',
                'pcm': 'en',      // Nigerian Pidgin -> English voice
                'pidgin': 'en',   // Alternative pidgin code
                'naija': 'en',    // Nigerian slang
                'ng': 'en'        // Nigeria code
            };

            let language = 'en';
            let text;
            let displayLanguage = 'English';

            // Check if first arg is a language code
            const firstArg = args[0].toLowerCase();
            if (firstArg.length <= 6 && languageMap[firstArg]) {
                language = languageMap[firstArg];
                displayLanguage = firstArg === 'pcm' || firstArg === 'pidgin' || firstArg === 'naija' 
                    ? 'Nigerian Pidgin' 
                    : firstArg.toUpperCase();
                text = args.slice(1).join(' ');
            } else {
                text = args.join(' ');
                displayLanguage = 'English';
            }

            if (!text || text.trim() === '') {
                return await sock.sendMessage(from, {
                    text: `❌ *No text provided!*\n\n📝 Usage: /tts [language] [text]\n💡 Example: /tts pcm How you dey`
                }, { quoted: msg });
            }

            const processingMsg = await sock.sendMessage(from, {
                text: `🔊 *Generating speech...*\n\n📝 Text: ${text}\n🌍 Language: ${displayLanguage}\n\n⏳ Please wait...`
            }, { quoted: msg });

            await generateSpeech(sock, from, msg, text, language, displayLanguage, processingMsg);

        } catch (error) {
            console.error('❌ TTS error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *TTS failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n│\n` +
                    `├◆ 💡 Try again with shorter text\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};

async function generateSpeech(sock, from, msg, text, language, displayLanguage, processingMsg) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const audioPath = path.join(tempDir, `tts_${Date.now()}.mp3`);

    try {
        // Method 1: Using gtts library (Most Reliable)
        const ttsInstance = new gtts(text, language);

        await new Promise((resolve, reject) => {
            ttsInstance.save(audioPath, (err) => {
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
            text: `✅ *Speech generated!*\n\n📝 Text: ${text}\n🌍 Language: ${displayLanguage}\n📦 Size: ${fileSizeMB} MB\n\n${displayLanguage === 'Nigerian Pidgin' ? '💡 *Note:* Using English voice for Pidgin text' : ''}`,
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
                text: `✅ *Speech generated!*\n\n📝 Text: ${text}\n🌍 Language: ${displayLanguage}\n🔧 Method: Google TTS Fallback\n\n${displayLanguage === 'Nigerian Pidgin' ? '💡 *Note:* Using English voice for Pidgin text' : ''}`,
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