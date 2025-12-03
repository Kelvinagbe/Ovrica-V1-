// commands/song.js - Alternative API Method (No Cookies Required)
// Install: npm install axios yt-search

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    name: 'song',
    admin: false,
    description: 'Download songs using alternative API',

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

            // Search YouTube
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

            // Duration check
            if (video.durationInSec > 600) {
                return await sock.sendMessage(from, {
                    text: `❌ *Song too long!*\n\n` +
                        `📝 Found: ${video.title}\n` +
                        `⏱️ Duration: ${video.duration}\n` +
                        `⚠️ Maximum: 10 minutes`,
                    edit: searchMsg.key
                });
            }

            await sock.sendMessage(from, { delete: searchMsg.key }).catch(() => {});

            // Send info
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

            // Download using API
            await downloadWithAPI(sock, from, msg, video, downloadType);

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

// Download using multiple API fallbacks
async function downloadWithAPI(sock, from, msg, video, type) {
    const processingMsg = await sock.sendMessage(from, {
        text: `⏳ *Downloading ${type}...*\n\n🎵 ${video.title}\n⏱️ ${video.duration}\n\n📥 Please wait...`
    }, { quoted: msg });

    try {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // API endpoints (ordered by reliability)
        const apis = [
            {
                name: 'API 1',
                getUrl: async () => {
                    const response = await axios.get(`https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(video.title)}`, {
                        timeout: 60000
                    });
                    return type === 'audio' ? response.data.result.mp3 : response.data.result.mp4;
                }
            },
            {
                name: 'API 2',
                getUrl: async () => {
                    const response = await axios.get(`https://api.agatz.xyz/api/ytplay?message=${encodeURIComponent(video.title)}`, {
                        timeout: 60000
                    });
                    return type === 'audio' ? response.data.data.mp3 : response.data.data.mp4;
                }
            },
            {
                name: 'API 3',
                getUrl: async () => {
                    const response = await axios.get(`https://api.nyxs.pw/dl/yt-direct?url=${encodeURIComponent(video.url)}&type=${type === 'audio' ? 'audio' : 'video'}`, {
                        timeout: 60000
                    });
                    return response.data.result.download;
                }
            }
        ];

        let downloadUrl = null;
        let successAPI = null;

        // Try each API
        for (const api of apis) {
            try {
                console.log(`🔄 Trying ${api.name}...`);
                downloadUrl = await api.getUrl();
                
                if (downloadUrl) {
                    console.log(`✅ Success with ${api.name}`);
                    successAPI = api.name;
                    break;
                }
            } catch (error) {
                console.log(`❌ ${api.name} failed:`, error.message);
            }
        }

        if (!downloadUrl) {
            throw new Error('All API endpoints failed. Try again later.');
        }

        // Download file from URL
        console.log('📥 Downloading file from:', downloadUrl);
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000, // 2 minutes
            maxContentLength: 100 * 1024 * 1024, // 100MB max
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const fileBuffer = Buffer.from(response.data);
        const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

        console.log(`✅ Downloaded: ${fileSizeMB}MB`);

        // Size check
        if (fileBuffer.length > 100 * 1024 * 1024) {
            return await sock.sendMessage(from, {
                text: `❌ *File too large!*\n\n📦 Size: ${fileSizeMB} MB\n⚠️ Maximum: 100 MB`,
                edit: processingMsg.key
            });
        }

        // Send file
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
            // Download thumbnail
            let thumbnailBuffer = null;
            try {
                const thumbResponse = await axios.get(video.thumbnail, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                thumbnailBuffer = Buffer.from(thumbResponse.data);
            } catch (err) {
                console.warn('⚠️ Thumbnail download failed');
            }

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
                `🎵 ${video.title}\n` +
                `📦 Size: ${fileSizeMB} MB\n` +
                `🔧 Method: ${successAPI}`,
            edit: processingMsg.key
        });

    } catch (error) {
        console.error('❌ Download error:', error);

        let errorMsg = error.message;
        let errorSolution = 'Try again or try a different song';

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMsg = 'Download timeout';
            errorSolution = 'Song may be too long, try a shorter one';
        } else if (error.response?.status === 404) {
            errorMsg = 'File not found';
            errorSolution = 'Try a different song';
        } else if (error.message.includes('maxContentLength')) {
            errorMsg = 'File too large';
            errorSolution = 'Try a shorter song';
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