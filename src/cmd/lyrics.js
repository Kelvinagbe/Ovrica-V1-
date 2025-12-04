const axios = require('axios');

module.exports = {
    name: 'lyrics',
    admin: false,
    description: 'Get song lyrics',

    exec: async (sock, from, args, msg) => {
        try {
            if (args.length === 0) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ LYRICS FINDER ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Find any song lyrics*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜USAGE⌟* ◆\n│\n` +
                        `├◆ /lyrics [artist] - [song]\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /lyrics Ed Sheeran - Shape of You\n` +
                        `├◆ /lyrics Adele - Hello\n` +
                        `├◆ /lyrics The Weeknd - Blinding Lights\n│\n` +
                        `└ ❏\n> Powered by 🎵Lyrics API🎵`
                }, { quoted: msg });
            }

            const query = args.join(' ');
            const [artist, song] = query.split('-').map(s => s.trim());

            if (!artist || !song) {
                return await sock.sendMessage(from, {
                    text: `❌ *Invalid format!*\n\n✅ Use: /lyrics [artist] - [song]\n\nExample: /lyrics Eminem - Lose Yourself`
                }, { quoted: msg });
            }

            await sock.sendMessage(from, {
                text: `🎵 *Searching lyrics...*\n\n👤 Artist: ${artist}\n🎧 Song: ${song}\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Get lyrics from lyrics.ovh (FREE API)
            const lyrics = await getLyrics(artist, song);

            // Split long lyrics into chunks
            const chunks = splitLyrics(lyrics, artist, song);

            for (const chunk of chunks) {
                await sock.sendMessage(from, { text: chunk }, { quoted: msg });
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between messages
            }

        } catch (error) {
            console.error('Lyrics error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Lyrics not found!*\n\n📝 Try:\n` +
                    `• Check spelling\n` +
                    `• Use format: Artist - Song\n` +
                    `• Try simpler song names\n\n` +
                    `Example: /lyrics Eminem - Stan`
            }, { quoted: msg });
        }
    }
};

// Get lyrics from lyrics.ovh (FREE)
async function getLyrics(artist, song) {
    try {
        const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
        return response.data.lyrics;
    } catch (error) {
        throw new Error('Lyrics not found');
    }
}

// Split lyrics into chunks for WhatsApp
function splitLyrics(lyrics, artist, song) {
    const maxLength = 4000;
    const chunks = [];
    
    const header = `┌ ❏ *⌜ ${song.toUpperCase()} ⌟* ❏\n│\n├◆ 👤 Artist: ${artist}\n├◆ 🎵 Song: ${song}\n│\n└ ❏\n\n`;
    
    let currentChunk = header;
    const lines = lyrics.split('\n');
    
    for (const line of lines) {
        if ((currentChunk + line + '\n').length > maxLength) {
            chunks.push(currentChunk + '\n\n> 🎵 Continued...');
            currentChunk = '> 🎵 ...Continued\n\n';
        }
        currentChunk += line + '\n';
    }
    
    if (currentChunk) {
        chunks.push(currentChunk + '\n\n> 🎵 Powered by Lyrics.ovh');
    }
    
    return chunks;
}