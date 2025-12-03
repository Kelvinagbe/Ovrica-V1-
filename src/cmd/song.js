// commands/song.js - YouTube Song Downloader with play-dl
// Install: npm install play-dl

const fs = require('fs');
const path = require('path');
const play = require('play-dl');

module.exports = {
    name: 'song',
    admin: false,
    description: 'Search and download songs from YouTube',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Show help if no arguments
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

            // Parse format selection (1 or 2)
            let downloadType = 'audio'; // Default to audio
            let songName;

            if (args[0] === '1' || args[0] === '2') {
                downloadType = args[0] === '1' ? 'audio' : 'video';
                songName = args.slice(1).join(' ');
            } else {
                // If no format specified, default to audio
                songName = args.join(' ');
            }

            // Validate song name
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

            // Search YouTube using play-dl
            const searchResults = await play.search(songName, {
                limit: 1,
                source: { youtube: 'video' }
            });

            if (!searchResults || searchResults.length === 0) {
                return await sock.sendMessage(from, {
                    text: `❌ *No results found!*\n\n` +
                        `📝 Try:\n• Different song name\n• Add artist name\n• Check spelling`,
                    edit: searchMsg.key
                });
            }

            const result = searchResults[0];

            // Format video data
            const video = {
                title: result.title,
                url: result.url,
                thumbnail: result.thumbnails[0]?.url || 'https://i.ibb.co/0FksjQz/icon.jpg',
                duration: result.durationRaw || '0:00',
                durationInSec: result.durationInSec || 0,
                channel: result.channel?.name || 'Unknown',
                views: result.views || 0,
                uploadedAt: result.uploadedAt || 'Unknown'
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

            // Download and send thumbnail
            let thumbnailBuffer = null;
            try {
                thumbnailBuffer = await getThumbnail(video.thumbnail);
            } catch (error) {
                console.warn('⚠️ Thumbnail failed:', error.message);
            }

            // Delete search message
            await sock.sendMessage(from, { delete: searchMsg.key }).catch(() => {});

            // Send result with thumbnail and info
            if (thumbnailBuffer) {
                await sock.sendMessage(from, {
                    image: thumbnailBuffer,
                    caption: `┌ ❏ *⌜ SONG FOUND ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Title:* ${video.title}\n` +
                        `├◆ 👤 *Channel:* ${video.channel}\n` +
                        `├◆ ⏱️ *Duration:* ${video.duration}\n` +
                        `├◆ 👁️ *Views:* ${video.views.toLocaleString()}\n` +
                        `├◆ 📅 *Uploaded:* ${video.uploadedAt}\n` +
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
                        `├◆ 📅 *Uploaded:* ${video.uploadedAt}\n` +
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

            // Start download immediately
            await downloadMedia(sock, from, msg, video, downloadType);

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

async function downloadMedia(sock, from, msg, video, type) {
    const processingMsg = await sock.sendMessage(from, {
        text: `⏳ *Downloading ${type}...*\n\n` +
            `🎵 ${video.title}\n⏱️ ${video.duration}\n\n` +
            `📥 Please wait...`
    }, { quoted: msg });

    try {
        // Validate URL
        const validate = await play.validate(video.url);
        if (validate !== 'yt_video') {
            throw new Error('Invalid YouTube URL');
        }

        // Get stream info
        const stream = await play.stream(video.url, {
            quality: type === 'audio' ? 2 : 0
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const extension = type === 'audio' ? 'mp3' : 'mp4';
        const fileName = `${type}_${Date.now()}.${extension}`;
        const filePath = path.join(tempDir, fileName);
        const writeStream = fs.createWriteStream(filePath);

        // Pipe stream to file
        stream.stream.pipe(writeStream);

        writeStream.on('finish', async () => {
            try {
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
                    const thumbnailBuffer = await getThumbnail(video.thumbnail);
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

            } catch (sendError) {
                console.error('❌ Send error:', sendError);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                throw sendError;
            }
        });

        writeStream.on('error', (error) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw error;
        });

        stream.stream.on('error', (error) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw error;
        });

    } catch (error) {
        console.error('❌ Download error:', error);

        let errorMsg = error.message;
        let errorSolution = 'Try again';

        if (error.message.includes('403') || error.message.includes('410')) {
            errorMsg = 'Video restricted';
            errorSolution = 'Cannot download this video';
        } else if (error.message.includes('ENOSPC')) {
            errorMsg = 'No storage space';
            errorSolution = 'Server storage full';
        } else if (error.message.includes('Invalid')) {
            errorMsg = 'Invalid video URL';
            errorSolution = 'Try searching again';
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