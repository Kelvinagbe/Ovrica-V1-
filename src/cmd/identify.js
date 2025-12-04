const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'identify',
    admin: false,
    description: 'Identify songs from audio',

    exec: async (sock, from, args, msg) => {
        let tempPath;
        
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const audioMsg = msg.message?.audioMessage || quotedMsg?.audioMessage;

            if (!audioMsg) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SONG IDENTIFIER ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Identify any song*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n│\n` +
                        `├◆ 1. Record/send audio of song\n` +
                        `├◆ 2. Reply with /identify\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜TIPS⌟* ◆\n│\n` +
                        `├◆ • 5-15 seconds of audio\n` +
                        `├◆ • Clear audio quality\n` +
                        `├◆ • Minimal background noise\n│\n` +
                        `└ ❏\n> Powered by 🎵Shazam🎵`
                }, { quoted: msg });
            }

            await sock.sendMessage(from, {
                text: `🎵 *Identifying song...*\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Download audio
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            const chunks = [];
            
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            
            const buffer = Buffer.concat(chunks);

            // Create temp directory
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            tempPath = path.join(tempDir, `identify_${Date.now()}.ogg`);
            fs.writeFileSync(tempPath, buffer);

            // Identify using Shazam (FREE API)
            const result = await identifySong(buffer);

            if (result.track) {
                let response = `┌ ❏ *⌜ SONG IDENTIFIED ⌟* ❏\n│\n`;
                response += `├◆ 🎵 Title: ${result.track.title}\n`;
                response += `├◆ 👤 Artist: ${result.track.subtitle}\n`;
                response += `├◆ 💿 Album: ${result.track.sections?.[0]?.metadata?.[0]?.text || 'Unknown'}\n`;
                response += `├◆ 📅 Year: ${result.track.sections?.[0]?.metadata?.[2]?.text || 'Unknown'}\n│\n`;
                response += `└ ❏\n`;
                
                if (result.track.share?.href) {
                    response += `🔗 Listen: ${result.track.share.href}\n\n`;
                }
                
                response += `> 🎵 Powered by Shazam`;

                // Send with cover art if available
                if (result.track.images?.coverart) {
                    return await sock.sendMessage(from, {
                        image: { url: result.track.images.coverart },
                        caption: response
                    });
                } else {
                    return await sock.sendMessage(from, { text: response }, { quoted: msg });
                }
            } else {
                throw new Error('Song not recognized');
            }

        } catch (error) {
            console.error('Identify error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Could not identify song!*\n\n📝 Tips:\n` +
                    `• Make sure audio is clear\n` +
                    `• Record 10-15 seconds\n` +
                    `• Reduce background noise\n` +
                    `• Try a different part of the song`
            }, { quoted: msg });
            
        } finally {
            if (tempPath && fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }
};

// Identify song using Shazam RapidAPI (FREE tier available)
async function identifySong(audioBuffer) {
    // Using Shazam Core API (FREE)
    const base64Audio = audioBuffer.toString('base64');
    
    const response = await axios.post('https://shazam.p.rapidapi.com/songs/v2/detect', 
        audioBuffer,
        {
            headers: {
                'content-type': 'text/plain',
                'X-RapidAPI-Key': '46e0be0905msh376b8faa6b10cd4p178e5djsn483fc6e5925d', // Get free key from rapidapi.com
                'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
            },
            timeout: 30000
        }
    );

    return response.data;
}