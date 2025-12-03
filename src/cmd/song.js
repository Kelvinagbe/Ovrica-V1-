// commands/song.js - Production-Ready YouTube Downloader
// Install: npm install yt-dlp-wrap yt-search node-fetch

const fs = require('fs');
const path = require('path');
const YTDlpWrap = require('yt-dlp-wrap').default;
const yts = require('yt-search');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

let ytDlpWrap;
let ytDlpPath;

// Initialize yt-dlp with auto-update
async function initYtDlp() {
    ytDlpPath = path.join(__dirname, '../temp/yt-dlp');
    
    try {
        // Download if not exists
        if (!fs.existsSync(ytDlpPath)) {
            console.log('📥 Downloading yt-dlp binary...');
            await YTDlpWrap.downloadFromGithub(ytDlpPath);
            console.log('✅ yt-dlp downloaded!');
        }
        
        ytDlpWrap = new YTDlpWrap(ytDlpPath);
        
        // Auto-update yt-dlp (critical for YouTube compatibility)
        try {
            await execPromise(`${ytDlpPath} -U`);
            console.log('✅ yt-dlp updated to latest version');
        } catch (updateError) {
            console.warn('⚠️ Could not auto-update yt-dlp:', updateError.message);
        }
    } catch (error) {
        console.error('❌ yt-dlp initialization failed:', error);
        throw error;
    }
}

module.exports = {
    name: 'song',
    admin: false,
    description: 'Search and download songs from YouTube with anti-bot protection',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Initialize yt-dlp
            if (!ytDlpWrap) {
                await initYtDlp();
            }

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

            // Download thumbnail
            let thumbnailBuffer = null;
            try {
                thumbnailBuffer = await getThumbnail(video.thumbnail);
            } catch (error) {
                console.warn('⚠️ Thumbnail failed:', error.message);
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

// Download with multiple fallback strategies
async function downloadMedia(sock, from, msg, video, type, thumbnailBuffer) {
    const processingMsg = await sock.sendMessage(from, {
        text: `⏳ *Downloading ${type}...*\n\n🎵 ${video.title}\n⏱️ ${video.duration}\n\n📥 Please wait...`
    }, { quoted: msg });

    try {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const extension = type === 'audio' ? 'mp3' : 'mp4';
        const fileName = `${type}_${Date.now()}.${extension}`;
        const filePath = path.join(tempDir, fileName);
        const cookiePath = path.join(__dirname, '../cookies.txt');

        // Strategy configurations (ordered by reliability)
        const strategies = [
            {
                name: 'Android Client + OAuth',
                args: [
                    video.url,
                    '--extractor-args', 'youtube:player_client=android,web',
                    '--user-agent', 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip',
                    '-o', filePath
                ]
            },
            {
                name: 'iOS Client',
                args: [
                    video.url,
                    '--extractor-args', 'youtube:player_client=ios',
                    '--user-agent', 'com.google.ios.youtube/17.33.2 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
                    '-o', filePath
                ]
            },
            {
                name: 'Web Client with Cookies',
                args: fs.existsSync(cookiePath) ? [
                    video.url,
                    '--cookies', cookiePath,
                    '--extractor-args', 'youtube:player_client=web',
                    '-o', filePath
                ] : null
            },
            {
                name: 'TV Client',
                args: [
                    video.url,
                    '--extractor-args', 'youtube:player_client=tv_embedded',
                    '-o', filePath
                ]
            },
            {
                name: 'Default Client',
                args: [
                    video.url,
                    '--extractor-args', 'youtube:player_client=default',
                    '-o', filePath
                ]
            },
            {
                name: 'MediaConnect (No Auth)',
                args: [
                    video.url,
                    '--extractor-args', 'youtube:player_client=mediaconnect',
                    '-o', filePath
                ]
            }
        ];

        // Add format-specific arguments
        for (const strategy of strategies) {
            if (!strategy.args) continue;
            
            if (type === 'audio') {
                strategy.args.push(
                    '-f', 'bestaudio/best',
                    '-x',
                    '--audio-format', 'mp3',
                    '--audio-quality', '0',
                    '--embed-thumbnail',
                    '--add-metadata'
                );
            } else {
                strategy.args.push(
                    '-f', 'best[height<=480][ext=mp4]/best[height<=480]/best[ext=mp4]/best',
                    '--merge-output-format', 'mp4'
                );
            }

            // Common args for all strategies
            strategy.args.push(
                '--no-warnings',
                '--no-check-certificate',
                '--prefer-insecure',
                '--geo-bypass',
                '--socket-timeout', '30'
            );
        }

        // Try each strategy
        let lastError;
        let successStrategy = null;

        for (const strategy of strategies.filter(s => s.args)) {
            try {
                console.log(`🔄 Trying strategy: ${strategy.name}`);
                
                await ytDlpWrap.execPromise(strategy.args);
                
                if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                    console.log(`✅ Success with: ${strategy.name}`);
                    successStrategy = strategy.name;
                    break;
                }
            } catch (error) {
                console.log(`❌ ${strategy.name} failed:`, error.message);
                lastError = error;
                
                // Clean up failed attempts
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); } catch {}
                }
            }
        }

        // Check if download succeeded
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            throw lastError || new Error('All download strategies failed. YouTube may be blocking requests.');
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

        // Size check
        if (fileBuffer.length > 100 * 1024 * 1024) {
            fs.unlinkSync(filePath);
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
                mimetype: 'video/mp4',
                jpegThumbnail: thumbnailBuffer
            });
        }

        await sock.sendMessage(from, {
            text: `✅ *${type === 'audio' ? 'Audio' : 'Video'} sent!*\n\n` +
                `🎵 ${video.title}\n` +
                `📦 Size: ${fileSizeMB} MB\n` +
                `🔧 Method: ${successStrategy}`,
            edit: processingMsg.key
        });

        // Cleanup
        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('❌ Download error:', error);

        let errorMsg = error.message;
        let errorSolution = 'Try again or try a different song';

        if (error.message.includes('bot')) {
            errorMsg = 'YouTube bot detection triggered';
            errorSolution = 'Add cookies.txt file or wait and retry';
        } else if (error.message.includes('Sign in')) {
            errorMsg = 'YouTube requires authentication';
            errorSolution = 'Export YouTube cookies to cookies.txt';
        } else if (error.message.includes('403') || error.message.includes('410')) {
            errorMsg = 'Video restricted or unavailable';
            errorSolution = 'Cannot download this video';
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