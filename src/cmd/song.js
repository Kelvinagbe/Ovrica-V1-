// commands/song.js - Ultimate Working Solution
// Install: npm install axios yt-search cheerio

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
        // Working downloaders with API rotation
        const downloaders = [
            // Downloader 1: SaveFrom.net alternative
            {
                name: 'SaveFrom',
                download: async () => {
                    const apiUrl = `https://cdn49.savetube.me/info?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(apiUrl, {
                        timeout: 60000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json'
                        }
                    });
                    
                    const data = response.data;
                    if (!data?.data?.dlink) throw new Error('No download link');
                    
                    const formats = data.data.dlink;
                    let downloadUrl;
                    
                    if (type === 'audio') {
                        downloadUrl = formats['140']?.[0]?.url || formats['139']?.[0]?.url;
                    } else {
                        downloadUrl = formats['136']?.[0]?.url || formats['18']?.[0]?.url;
                    }
                    
                    if (!downloadUrl) throw new Error('Format not found');
                    return downloadUrl;
                }
            },
            
            // Downloader 2: Y2Mate style
            {
                name: 'Y2Mate',
                download: async () => {
                    const apiUrl = `https://api.cobalt.tools/api/json`;
                    const response = await axios.post(apiUrl, {
                        url: video.url,
                        vCodec: type === 'video' ? 'h264' : undefined,
                        vQuality: type === 'video' ? '480' : undefined,
                        aFormat: type === 'audio' ? 'mp3' : undefined,
                        isAudioOnly: type === 'audio'
                    }, {
                        timeout: 60000,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                    
                    if (response.data?.url) return response.data.url;
                    throw new Error('No download URL');
                }
            },
            
            // Downloader 3: YT5s
            {
                name: 'YT5s',
                download: async () => {
                    const apiUrl = `https://yt5s.biz/api/ajaxSearch`;
                    
                    // Get video info first
                    const infoResponse = await axios.post(apiUrl, 
                        new URLSearchParams({
                            q: video.url,
                            vt: 'mp3'
                        }), {
                        timeout: 60000,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                    
                    const vid = infoResponse.data?.vid;
                    if (!vid) throw new Error('Video ID not found');
                    
                    // Get download link
                    const convertUrl = `https://yt5s.biz/api/ajaxConvert`;
                    const convertResponse = await axios.post(convertUrl,
                        new URLSearchParams({
                            vid: vid,
                            k: infoResponse.data?.links?.[type === 'audio' ? 'mp3' : 'mp4']?.['mp3128']?.k || infoResponse.data?.links?.[type === 'audio' ? 'mp3' : 'mp4']?.['360']?.k
                        }), {
                        timeout: 60000,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    
                    if (convertResponse.data?.dlink) return convertResponse.data.dlink;
                    throw new Error('Conversion failed');
                }
            },

            // Downloader 4: Direct extraction
            {
                name: 'Direct',
                download: async () => {
                    const apiUrl = `https://www.yt1s.com/api/ajaxSearch/index`;
                    const response = await axios.post(apiUrl,
                        new URLSearchParams({
                            q: video.url,
                            vt: type === 'audio' ? 'mp3' : 'mp4'
                        }), {
                        timeout: 60000,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                    
                    // Extract download link from response
                    const links = response.data?.links?.[type === 'audio' ? 'mp3' : 'mp4'];
                    if (!links) throw new Error('No links found');
                    
                    // Get first available quality
                    const firstKey = Object.keys(links)[0];
                    const k = links[firstKey]?.k;
                    
                    if (!k) throw new Error('No key found');
                    
                    // Convert
                    const convertUrl = `https://www.yt1s.com/api/ajaxConvert/convert`;
                    const convertResponse = await axios.post(convertUrl,
                        new URLSearchParams({
                            vid: response.data.vid,
                            k: k
                        }), {
                        timeout: 60000
                    });
                    
                    if (convertResponse.data?.dlink) return convertResponse.data.dlink;
                    throw new Error('No download link');
                }
            }
        ];

        let downloadUrl = null;
        let successDownloader = null;

        // Try each downloader
        for (const downloader of downloaders) {
            try {
                console.log(`🔄 Trying ${downloader.name}...`);
                downloadUrl = await downloader.download();
                
                if (downloadUrl) {
                    console.log(`✅ Success with ${downloader.name}`);
                    successDownloader = downloader.name;
                    break;
                }
            } catch (error) {
                console.log(`❌ ${downloader.name} failed:`, error.message);
            }
        }

        if (!downloadUrl) {
            throw new Error('All download services failed. YouTube may be blocking requests.');
        }

        // Download file
        console.log('📥 Downloading from:', downloadUrl);
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxContentLength: 100 * 1024 * 1024,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.youtube.com/'
            }
        });

        const fileBuffer = Buffer.from(fileResponse.data);
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
                `🔧 Service: ${successDownloader}`,
            edit: processingMsg.key
        });

    } catch (error) {
        console.error('❌ Download error:', error);

        let errorMsg = error.message;
        let errorSolution = 'Try again or use a different song';

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMsg = 'Download timeout';
            errorSolution = 'Song may be too long, try a shorter one';
        } else if (error.response?.status === 404) {
            errorMsg = 'File not found';
            errorSolution = 'Try a different song';
        } else if (error.message.includes('bot')) {
            errorMsg = 'Service temporarily unavailable';
            errorSolution = 'Try again in a few minutes';
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