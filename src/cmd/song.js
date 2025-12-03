// commands/song.js - Without FFmpeg (Simplified)
// Install: npm install @distube/ytdl-core yt-search

const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

// Create agent to bypass bot detection
const cookies = [{
    "domain": ".youtube.com",
    "expirationDate": 1799999999,
    "hostOnly": false,
    "httpOnly": false,
    "name": "PREF",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "value": "tz=America.New_York"
}];

const agent = ytdl.createAgent(cookies);

module.exports = {
    name: 'song',
    admin: false,
    description: 'Download songs (simplified version)',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SONG DOWNLOADER ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Download Songs*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n│\n` +
                        `├◆ 📝 /song [song name]\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /song Faded\n` +
                        `├◆ /song Shape of You\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            const songName = args.join(' ');

            const searchMsg = await sock.sendMessage(from, {
                text: `🔍 *Searching:* ${songName}\n📥 *Format:* 🎵 Audio\n\n⏳ Please wait...`
            }, { quoted: msg });

            const searchResults = await yts(songName);
            
            if (!searchResults?.videos?.length) {
                return await sock.sendMessage(from, {
                    text: `❌ *No results found!*`,
                    edit: searchMsg.key
                });
            }

            const result = searchResults.videos[0];
            const video = {
                title: result.title,
                url: result.url,
                videoId: result.videoId,
                thumbnail: result.thumbnail,
                duration: result.timestamp || '0:00',
                durationInSec: result.seconds || 0,
                channel: result.author?.name || 'Unknown',
                views: result.views || 0
            };

            if (video.durationInSec > 600) {
                return await sock.sendMessage(from, {
                    text: `❌ *Song too long!* (Max: 10 minutes)`,
                    edit: searchMsg.key
                });
            }

            await sock.sendMessage(from, { delete: searchMsg.key }).catch(() => {});

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ DOWNLOADING ⌟* ❏\n│\n` +
                    `├◆ 🎵 ${video.title}\n` +
                    `├◆ ⏱️ ${video.duration}\n│\n` +
                    `└ ❏\n> ⏳ Please wait...`,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: `${video.channel} • ${video.duration}`,
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: video.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg });

            await downloadAudio(sock, from, msg, video);

        } catch (error) {
            console.error('❌ Error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Error:* ${error.message}`
            }, { quoted: msg });
        }
    }
};

async function downloadAudio(sock, from, msg, video) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const filePath = path.join(tempDir, `audio_${Date.now()}.m4a`);

    try {
        // Get video info
        const info = await ytdl.getInfo(video.url, { agent });

        // Download audio stream
        const audioStream = ytdl(video.url, {
            agent,
            quality: 'lowestaudio',
            filter: 'audioonly'
        });

        const writeStream = fs.createWriteStream(filePath);
        
        await new Promise((resolve, reject) => {
            audioStream.pipe(writeStream);
            audioStream.on('error', reject);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        const fileBuffer = fs.readFileSync(filePath);
        const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

        if (fileBuffer.length > 100 * 1024 * 1024) {
            fs.unlinkSync(filePath);
            return await sock.sendMessage(from, {
                text: `❌ *File too large!* (${fileSizeMB}MB)`
            }, { quoted: msg });
        }

        await sock.sendMessage(from, {
            audio: fileBuffer,
            mimetype: 'audio/mp4',
            fileName: `${video.title}.m4a`,
            contextInfo: {
                externalAdReply: {
                    title: video.title,
                    body: `${video.channel} • ${video.duration}`,
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: video.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });

        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('❌ Download failed:', error);
        
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await sock.sendMessage(from, {
            text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                `├◆ ❌ Download failed\n` +
                `├◆ 📝 ${error.message}\n│\n` +
                `└ ❏`
        }, { quoted: msg });
    }
}