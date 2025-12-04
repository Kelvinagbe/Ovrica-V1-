const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const play = require('play-dl');

module.exports = {
    name: 'play',
    admin: false,
    description: 'Play a song from YouTube',

    exec: async (sock, from, args, msg, isAdmin) => {
        let filePath = null;
        
        try {
            if (args.length === 0) {
                return await sock.sendMessage(from, {
                    text: '❌ Please provide a song name!\n\n*Usage:* .play <song name>\n*Example:* .play shape of you'
                }, { quoted: msg });
            }

            const songName = args.join(' ');
            
            await sock.sendMessage(from, {
                text: `🔍 Searching for: *${songName}*\n\nPlease wait...`
            }, { quoted: msg });

            // Search using yt-search
            console.log(`🔍 Searching: ${songName}`);
            const searchResults = await yts(songName);
            const videos = searchResults.videos;

            if (!videos || videos.length === 0) {
                return await sock.sendMessage(from, {
                    text: `❌ No results found for: *${songName}*\n\nPlease try a different search term.`
                }, { quoted: msg });
            }

            const video = videos[0];
            const videoUrl = video.url;
            const title = video.title;
            const thumbnail = video.thumbnail;
            const duration = video.timestamp;
            const views = video.views;
            const author = video.author.name;
            const uploadDate = video.ago;

            console.log(`✅ Found: ${title} by ${author}`);

            const infoMessage = 
                `┌ ❏ *⌜ SONG INFO ⌟* ❏\n` +
                `│\n` +
                `├◆ 🎵 *Title:* ${title}\n` +
                `├◆ 👤 *Artist:* ${author}\n` +
                `├◆ ⏱️ *Duration:* ${duration}\n` +
                `├◆ 👁️ *Views:* ${views.toLocaleString()}\n` +
                `├◆ 📅 *Uploaded:* ${uploadDate}\n` +
                `├◆ 🔗 *Link:* ${videoUrl}\n` +
                `│\n` +
                `└ ❏\n` +
                `⬇️ Downloading audio, please wait...`;

            await sock.sendMessage(from, {
                image: { url: thumbnail },
                caption: infoMessage
            }, { quoted: msg });

            // Get stream info
            const stream = await play.stream(videoUrl);
            
            // Create temp directory
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            filePath = path.join(tempDir, `${timestamp}.mp3`);
            
            // Download the audio
            const writeStream = fs.createWriteStream(filePath);
            stream.stream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            console.log(`✅ Audio downloaded: ${filePath}`);

            // Send the audio file
            await sock.sendMessage(from, {
                audio: fs.readFileSync(filePath),
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: msg });

            console.log(`🎵 Audio sent to ${from}: ${title}`);

        } catch (error) {
            console.error('❌ Play command error:', error);
            await sock.sendMessage(from, { 
                text: `❌ Failed to download the song.\n\n*Error:* ${error.message}` 
            }, { quoted: msg });
            
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                setTimeout(() => {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Cleaned up: ${filePath}`);
                    } catch (e) {
                        console.error('Cleanup error:', e);
                    }
                }, 5000);
            }
        }
    }
};