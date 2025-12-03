// commands/song.js - Most Reliable Solution with Premium APIs
// Install: npm install axios yt-search

const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const axios = require('axios');

module.exports = {
    name: 'song',
    admin: false,
    description: 'Download songs from YouTube',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SONG DOWNLOADER ⌟* ❏\n│\n` +
                        `├◆ 🎵 *Download Songs & Videos*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n│\n` +
                        `├◆ 📝 /song [1/2] [song name]\n│\n` +
                        `├◆ 1️⃣ = Audio (MP3)\n` +
                        `├◆ 2️⃣ = Video (MP4)\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /song 1 Faded\n` +
                        `├◆ /song 2 Shape of You\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
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

            if (!songName?.trim()) {
                return await sock.sendMessage(from, {
                    text: `❌ *No song name provided!*\n\n📝 Usage: /song [1/2] [song name]`
                }, { quoted: msg });
            }

            const searchMsg = await sock.sendMessage(from, {
                text: `🔍 *Searching:* ${songName}\n📥 *Format:* ${downloadType === 'audio' ? '🎵 Audio' : '🎬 Video'}\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Search YouTube
            const searchResults = await yts(songName);
            
            if (!searchResults?.videos?.length) {
                return await sock.sendMessage(from, {
                    text: `❌ *No results found!*\n\nTry a different search term.`,
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
                    text: `❌ *Song too long!*\n\n⏱️ Duration: ${video.duration}\n⚠️ Maximum: 10 minutes`,
                    edit: searchMsg.key
                });
            }

            await sock.sendMessage(from, { delete: searchMsg.key }).catch(() => {});

            // Send song info
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ SONG FOUND ⌟* ❏\n│\n` +
                    `├◆ 🎵 *Title:* ${video.title}\n` +
                    `├◆ 👤 *Channel:* ${video.channel}\n` +
                    `├◆ ⏱️ *Duration:* ${video.duration}\n` +
                    `├◆ 👁️ *Views:* ${video.views.toLocaleString()}\n` +
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

            // Download
            await downloadMedia(sock, from, msg, video, downloadType);

        } catch (error) {
            console.error('❌ Song error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Error:* ${error.message}`
            }, { quoted: msg });
        }
    }
};

async function downloadMedia(sock, from, msg, video, type) {
    const processingMsg = await sock.sendMessage(from, {
        text: `⏳ *Downloading ${type}...*\n\n🎵 ${video.title}\n\n📥 Please wait...`
    }, { quoted: msg });

    try {
        // Premium working APIs (updated Dec 2024)
        const apis = [
            // API 1: Widipe API (Most Reliable)
            {
                name: 'Widipe',
                fetch: async () => {
                    const url = `https://widipe.com/download/ytdl?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { 
                        timeout: 60000,
                        headers: { 'User-Agent': 'WhatsApp Bot' }
                    });
                    
                    if (type === 'audio') {
                        return response.data?.result?.mp3 || response.data?.result?.audio?.url;
                    } else {
                        return response.data?.result?.mp4 || response.data?.result?.video?.url;
                    }
                }
            },
            
            // API 2: Gifted API
            {
                name: 'Gifted',
                fetch: async () => {
                    const endpoint = type === 'audio' ? 'ytmp3' : 'ytmp4';
                    const url = `https://api.giftedtech.my.id/api/download/${endpoint}?apikey=gifted&url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.result?.download_url;
                }
            },
            
            // API 3: Ryzen API
            {
                name: 'Ryzen',
                fetch: async () => {
                    const endpoint = type === 'audio' ? 'ytmp3' : 'ytmp4';
                    const url = `https://api.ryzendesu.vip/api/downloader/${endpoint}?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.url;
                }
            },
            
            // API 4: Bk9 API
            {
                name: 'Bk9',
                fetch: async () => {
                    const endpoint = type === 'audio' ? 'ytmp3' : 'ytmp4';
                    const url = `https://api.bk9.site/api/${endpoint}?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.BK9?.downloadUrl;
                }
            },
            
            // API 5: Zenith API
            {
                name: 'Zenith',
                fetch: async () => {
                    const url = `https://api-zenith.koyeb.app/api/download/ytmp${type === 'audio' ? '3' : '4'}?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.result?.download;
                }
            },
            
            // API 6: Siputzx API
            {
                name: 'Siputzx',
                fetch: async () => {
                    const endpoint = type === 'audio' ? 'ytmp3' : 'ytmp4';
                    const url = `https://api.siputzx.my.id/api/d/${endpoint}?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.data?.dl;
                }
            },
            
            // API 7: BTCh API
            {
                name: 'BTCh',
                fetch: async () => {
                    const url = `https://btch.us.kg/download/ytdl?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    
                    if (type === 'audio') {
                        return response.data?.audio?.url || response.data?.mp3;
                    } else {
                        return response.data?.video?.url || response.data?.mp4;
                    }
                }
            },
            
            // API 8: Shannz API
            {
                name: 'Shannz',
                fetch: async () => {
                    const endpoint = type === 'audio' ? 'ytmp3' : 'ytmp4';
                    const url = `https://api.shannmoderz.xyz/downloader/${endpoint}?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.result?.download;
                }
            },
            
            // API 9: Nyxs API
            {
                name: 'Nyxs',
                fetch: async () => {
                    const url = `https://api.nyxs.pw/dl/yt-direct?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.result?.urlAudio || response.data?.result?.urlVideo;
                }
            },
            
            // API 10: LolHuman API (requires key)
            {
                name: 'LolHuman',
                fetch: async () => {
                    const endpoint = type === 'audio' ? 'ytaudio2' : 'ytvideo2';
                    const url = `https://api.lolhuman.xyz/api/${endpoint}?apikey=GataDios&url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    return response.data?.result?.link;
                }
            }
        ];

        let downloadUrl = null;
        let successAPI = null;
        let lastError = null;

        // Try each API sequentially
        for (const api of apis) {
            try {
                console.log(`🔄 Trying ${api.name} API...`);
                downloadUrl = await api.fetch();
                
                if (downloadUrl && downloadUrl.startsWith('http')) {
                    console.log(`✅ Got URL from ${api.name}`);
                    successAPI = api.name;
                    break;
                }
            } catch (error) {
                lastError = error;
                console.log(`❌ ${api.name} failed:`, error.message);
            }
            
            // Small delay between attempts
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!downloadUrl) {
            throw new Error('All APIs failed. Please try again in a few minutes or try a different song.');
        }

        // Download the file
        console.log('📥 Downloading file from:', successAPI);
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000, // 3 minutes for large files
            maxContentLength: 100 * 1024 * 1024, // 100MB
            maxBodyLength: 100 * 1024 * 1024,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.youtube.com/',
                'Accept': '*/*'
            }
        });

        const fileBuffer = Buffer.from(fileResponse.data);
        const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

        console.log(`✅ Downloaded: ${fileSizeMB}MB`);

        // Size validation
        if (fileBuffer.length < 1000) {
            throw new Error('Downloaded file is too small (corrupted)');
        }

        if (fileBuffer.length > 100 * 1024 * 1024) {
            return await sock.sendMessage(from, {
                text: `❌ *File too large!*\n\n📦 Size: ${fileSizeMB} MB\n⚠️ Maximum: 100 MB`,
                edit: processingMsg.key
            });
        }

        // Send the file
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
                mimetype: 'video/mp4'
            });
        }

        await sock.sendMessage(from, {
            text: `✅ *${type === 'audio' ? 'Audio' : 'Video'} sent!*\n\n` +
                `🎵 ${video.title}\n` +
                `📦 Size: ${fileSizeMB} MB\n` +
                `🔧 API: ${successAPI}`,
            edit: processingMsg.key
        });

    } catch (error) {
        console.error('❌ Download error:', error);

        let errorMsg = error.message;
        let errorSolution = 'Try again in a few minutes or try a different song';

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMsg = 'Download timeout - file may be too large';
            errorSolution = 'Try a shorter song (under 5 minutes)';
        } else if (error.response?.status === 404) {
            errorMsg = 'Video not found or unavailable';
            errorSolution = 'Try a different song';
        } else if (error.message.includes('corrupted')) {
            errorMsg = 'Downloaded file is corrupted';
            errorSolution = 'Try again or use a different song';
        } else if (error.message.includes('large')) {
            errorMsg = 'File size exceeds limit';
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