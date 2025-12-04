const YTMusic = require('node-youtube-music').default;
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

module.exports = {
    name: 'play',
    admin: false,
    description: 'Play a song from YouTube',

    exec: async (sock, from, args, msg, isAdmin) => {
        let filePath = null;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(from, {
                    text: '❌ Please provide a song name!\n\n*Usage:* .play <song name>'
                }, { quoted: msg });
            }

            const songName = args.join(' ');
            
            await sock.sendMessage(from, {
                text: `🔍 Searching for: *${songName}*\n\nPlease wait...`
            }, { quoted: msg });

            const searchResults = await YTMusic.searchMusics(songName);

            if (!searchResults || searchResults.length === 0) {
                return await sock.sendMessage(from, {
                    text: `❌ No results found for: *${songName}*`
                }, { quoted: msg });
            }

            const song = searchResults[0];
            const videoId = song.youtubeId;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const title = song.title || song.name;
            const artist = song.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
            const duration = song.duration?.label || 'Unknown';
            const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

            const infoMessage = 
                `┌ ❏ *⌜ SONG INFO ⌟* ❏\n│\n` +
                `├◆ 🎵 *Title:* ${title}\n` +
                `├◆ 👤 *Artist:* ${artist}\n` +
                `├◆ ⏱️ *Duration:* ${duration}\n│\n` +
                `└ ❏\n⬇️ Downloading...`;

            await sock.sendMessage(from, {
                image: { url: thumbnail },
                caption: infoMessage
            }, { quoted: msg });

            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const fileName = `${Date.now()}.mp3`;
            filePath = path.join(tempDir, fileName);

            // Use system yt-dlp directly
            const command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 "${videoUrl}" -o "${filePath}"`;
            
            console.log('Executing:', command);
            await execPromise(command, { timeout: 60000 });

            if (!fs.existsSync(filePath)) {
                throw new Error('Download failed');
            }

            await sock.sendMessage(from, {
                audio: fs.readFileSync(filePath),
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: msg });

            console.log(`🎵 Sent: ${title}`);

        } catch (error) {
            console.error('Error:', error);
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message}\n\nMake sure yt-dlp is installed:\n\`sudo apt install yt-dlp\``
            });
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                setTimeout(() => fs.unlinkSync(filePath), 5000);
            }
        }
    }
};