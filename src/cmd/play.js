const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const YTDlpWrap = require('yt-dlp-wrap').default;

// Initialize yt-dlp with binary path
let ytDlpWrap;

async function initYtDlp() {
    const ytDlpPath = path.join(process.cwd(), 'bin', 'yt-dlp');
    
    // Check if yt-dlp binary exists
    if (!fs.existsSync(ytDlpPath)) {
        console.log('📥 Downloading yt-dlp binary...');
        try {
            await YTDlpWrap.downloadFromGithub(ytDlpPath);
            console.log('✅ yt-dlp binary downloaded');
        } catch (error) {
            console.error('❌ Failed to download yt-dlp:', error);
            throw new Error('Failed to download yt-dlp binary');
        }
    }
    
    ytDlpWrap = new YTDlpWrap(ytDlpPath);
    return ytDlpWrap;
}

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

            // Get the first video
            const video = videos[0];
            const videoUrl = video.url;
            const title = video.title;
            const thumbnail = video.thumbnail;
            const duration = video.timestamp;
            const views = video.views;
            const author = video.author.name;
            const uploadDate = video.ago;

            console.log(`✅ Found: ${title} by ${author}`);

            // Send song info with thumbnail
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
                caption: infoMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: title,
                        body: `${author} • ${duration}`,
                        thumbnail: { url: thumbnail },
                        sourceUrl: videoUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg });

            // Create temp directory
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            const outputPath = path.join(tempDir, `${timestamp}_${sanitizedTitle}.mp3`);
            
            console.log('📥 Downloading audio with yt-dlp...');

            // Initialize yt-dlp-wrap (downloads binary if needed)
            if (!ytDlpWrap) {
                await initYtDlp();
            }

            // Download audio using yt-dlp-wrap
            await ytDlpWrap.execPromise([
                videoUrl,
                '-f', 'bestaudio',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', outputPath,
                '--no-playlist',
                '--no-warnings',
                '--max-filesize', '100M',
                '--no-check-certificate',
                '--prefer-free-formats'
            ]);

            filePath = outputPath;
            console.log(`✅ Audio downloaded: ${filePath}`);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error('Download failed - file not found');
            }

            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`📦 File size: ${fileSizeMB} MB`);

            // Check if file is too large
            if (stats.size > 100 * 1024 * 1024) {
                throw new Error('File is too large to send via WhatsApp');
            }

            // Send the audio file
            await sock.sendMessage(from, {
                audio: fs.readFileSync(filePath),
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: author,
                        thumbnail: { url: thumbnail },
                        sourceUrl: videoUrl,
                        mediaType: 2,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });

            console.log(`🎵 Audio sent to ${from}: ${title}`);

        } catch (error) {
            console.error('❌ Play command error:', error);
            console.error('Error stack:', error.stack);
            
            let errorMessage = '❌ Failed to download the song.\n\n';
            
            if (error.message.includes('ENOENT') || error.message.includes('not found')) {
                errorMessage += '⚠️ *yt-dlp binary issue*\n\n';
                errorMessage += 'The bot is trying to download the yt-dlp binary. Please try again in a moment.';
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage += 'Download took too long. Try a shorter video.';
            } else if (error.message.includes('age')) {
                errorMessage += 'This video is age-restricted.';
            } else if (error.message.includes('unavailable') || error.message.includes('private')) {
                errorMessage += 'Video is unavailable or private.';
            } else if (error.message.includes('copyright')) {
                errorMessage += 'This video has copyright restrictions.';
            } else if (error.message.includes('too large') || error.message.includes('max-filesize')) {
                errorMessage += 'Audio file is too large (max 100MB).';
            } else {
                errorMessage += `*Error:* ${error.message}\n\nPlease try again or use a different song.`;
            }

            await sock.sendMessage(from, { text: errorMessage }, { quoted: msg });
            
        } finally {
            // Clean up the temporary file
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