// commands/song.js - YouTube Song Downloader with yt-dlp
// Install: npm install yt-dlp-wrap yt-search

const fs = require('fs');
const path = require('path');
const YTDlpWrap = require('yt-dlp-wrap').default;
const yts = require('yt-search');

// Initialize yt-dlp
const ytDlpWrap = new YTDlpWrap();

module.exports = {
    name: 'song',
    admin: false,
    description: 'Search and download songs from YouTube',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SONG DOWNLOADER ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Download Songs & Videos*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n│\n` +
                        `├◆ 📝 /song [1/2] [song name]\n│\n` +
                        `├◆ 1️⃣ = Audio (MP3) - Music only\n` +
                        `├◆ 2️⃣ = Video (MP4) - With video\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /song 1 Faded\n` +
                        `├◆ /song 2 Shape of You\n` +
                        `├◆ /song 1 Blinding Lights\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: "🎵 Song Downloader",
                            body: "Download audio or video",
                            thumbnailUrl: "https://i.ibb.co/0FksjQz/icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            let downloadType = 'audio';
            let songName;

            if (args[0] === '1' || args[0] === '2') {
                downloadType = args[0] === '1' ? 'audio' : 'video';
                songName = args.slice(1).join(' ');
            } else {
                songName = args.join(' ');
            }

            if (!songName || songName.trim() === '') {
                return await sock.sendMessage(from, {
                    text: `❌ *No song name provided!*\n\n` +
                        `📝 Usage: /song [1/2] [song name]\n` +
                        `Example: /song 1 Faded`
                }, { quoted: msg });
            }

            const searchMsg = await sock.sendMessage(from, {
                text: `🔍 *Searching:* ${songName}\n📥 *Format:* ${downloadType === 'audio' ? '🎵 Audio (MP3)' : '🎬 Video (MP4)'}\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Search YouTube using yt-search
            const searchResults = await yts(songName);
            
            if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
                return await sock.sendMessage(from, {
                    text: `❌ *No results found!*\n\n` +
                        `📝 Try:\n• Different song name\n• Add artist name\n• Check spelling`,
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
                views: result.views || 0,
                ago: result.ago || 'Unknown'
            };

            // Check duration (max 10 minutes)
            if (video.durationInSec > 600) {
                return await sock.sendMessage(from, {
                    text: `❌ *Song too long!*\n\n` +
                        `📝 Found: ${video.title}\n` +
                        `⏱️ Duration: ${video.duration}\n` +
                        `⚠️ Maximum: 10 minutes`,
                    edit: searchMsg.key
                });
            }

            // Download thumbnail
            let thumbnailBuffer = null;
            try {
                thumbnailBuffer = await getThumbnail(video.thumbnail);
            } catch (error) {
                console.warn('⚠️ Thumbnail failed:', error.message);
            }

            await sock.sendMessage(from, { delete: searchMsg.key }).catch(() => {});

            // Send result info
            if (thumbnailBuffer) {
                await sock.sendMessage(from, {
                    image: thumbnailBuffer,
                    caption: `┌ ❏ *⌜ SONG FOUND ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Title:* ${video.title}\n` +
                        `├◆ 👤 *Channel:* ${video.channel}\n` +
                        `├◆ ⏱️ *Duration:* ${video.duration}\n` +
                        `├◆ 👁️ *Views:* ${video.views.toLocaleString()}\n` +
                        `├◆ 📅 *Uploaded:* ${video.ago}\n` +
                        `├◆ 📥 *Format:* ${downloadType === 'audio' ? '🎵 Audio' : '🎬 Video'}\n│\n` +
                        `└ ❏\n> ⏳ Downloading...`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SONG FOUND ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Title:* ${video.title}\n` +
                        `├◆ 👤 *Channel:* ${video.channel}\n` +
                        `├◆ ⏱️ *Duration:* ${video.duration}\n` +
                        `├◆ 👁️ *Views:* ${video.views.toLocaleString()}\n` +
                        `├◆ 📅 *Uploaded:* ${video.ago}\n` +
                        `├◆ 📥 *Format:* ${downloadType === 'audio' ? '🎵 Audio' : '🎬 Video'}\n│\n` +
                        `└ ❏\n> ⏳ Downloading...`,
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
            }

            // Download media
            await downloadMedia(sock, from, msg, video, downloadType, thumbnailBuffer);

        } catch (error) {
            console.error('❌ Song error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *Search failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n│\n` +
                    `├◆ 💡 Try again later\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};

async function downloadMedia(sock, from, msg, video, type, thumbnailBuffer) {
    const processingMsg = await sock.sendMessage(from, {
        text: `⏳ *Downloading ${type}...*\n\n` +
            `🎵 ${video.title}\n⏱️ ${video.duration}\n\n` +
            `📥 Please wait...`
    }, { quoted: msg });

    try {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const extension = type === 'audio' ? 'mp3' : 'mp4';
        const fileName = `${type}_${Date.now()}.${extension}`;
        const filePath = path.join(tempDir, fileName);

        // Download with yt-dlp
        if (type === 'audio') {
            await ytDlpWrap.execPromise([
                video.url,
                '-f', 'bestaudio',
                '-x',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', filePath
            ]);
        } else {
            await ytDlpWrap.execPromise([
                video.url,
                '-f', 'best[height<=480]',
                '-o', filePath
            ]);
        }

        if (!fs.existsSync(filePath)) {
            throw new Error('Download failed - file not created');
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

        if (fileBuffer.length > 100 * 1024 * 1024) {
            fs.unlinkSync(filePath);
            return await sock.sendMessage(from, {
                text: `❌ *File too large!*\n\n` +
                    `📦 Size: ${fileSizeMB} MB\n` +
                    `⚠️ Maximum: 100 MB`,
                edit: processingMsg.key
            });
        }

        if (type === 'audio') {
            await sock.sendMessage(from, {
                audio: fileBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`,
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
            });
        } else {
            await sock.sendMessage(from, {
                video: fileBuffer,
                caption: `┌ ❏ *⌜ VIDEO ⌟* ❏\n│\n` +
                    `├◆ 🎵 *Title:* ${video.title}\n` +
                    `├◆ 👤 *Channel:* ${video.channel}\n` +
                    `├◆ ⏱️ *Duration:* ${video.duration}\n` +
                    `├◆ 📦 *Size:* ${fileSizeMB} MB\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`,
                mimetype: 'video/mp4',
                jpegThumbnail: thumbnailBuffer
            });
        }

        await sock.sendMessage(from, {
            text: `✅ *${type === 'audio' ? 'Audio' : 'Video'} sent!*\n\n` +
                `🎵 ${video.title}\n📦 Size: ${fileSizeMB} MB`,
            edit: processingMsg.key
        });

        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('❌ Download error:', error);

        let errorMsg = error.message;
        let errorSolution = 'Try again';

        if (error.message.includes('403') || error.message.includes('410')) {
            errorMsg = 'Video restricted or unavailable';
            errorSolution = 'Cannot download this video';
        } else if (error.message.includes('ENOSPC')) {
            errorMsg = 'No storage space';
            errorSolution = 'Server storage full';
        } else if (error.message.includes('private') || error.message.includes('removed')) {
            errorMsg = 'Video is private or removed';
            errorSolution = 'Try a different song';
        }

        await sock.sendMessage(from, {
            text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                `├◆ ❌ *Download failed*\n` +
                `├◆ 📝 *Error:* ${errorMsg}\n` +
                `├◆ 💡 *Solution:* ${errorSolution}\n│\n` +
                `└ ❏\n> Powered by 🎭Kelvin🎭`,
            edit: processingMsg.key
        });
    }
}

async function getThumbnail(url) {
    try {
        const https = require('https');
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            }).on('error', reject);
        });
    } catch (error) {
        return null;
    }
}