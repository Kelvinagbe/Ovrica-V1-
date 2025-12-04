const yts = require('yt-search');
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
            const outputPath = path.join(tempDir, `${timestamp}`);
            
            console.log('📥 Downloading audio with yt-dlp...');

            // Check if yt-dlp is installed
            try {
                await execPromise('yt-dlp --version');
            } catch (error) {
                throw new Error('yt-dlp not installed. Please install: sudo apt install yt-dlp');
            }

            // Download audio using yt-dlp
            const ytdlCommand = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}.%(ext)s" --no-playlist --no-warnings "${videoUrl}"`;
            
            console.log('Executing:', ytdlCommand);
            
            await execPromise(ytdlCommand, { 
                timeout: 120000, // 2 minutes timeout
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });

            // Find the downloaded file
            const files = fs.readdirSync(tempDir).filter(f => f.startsWith(timestamp.toString()));
            
            if (files.length === 0) {
                throw new Error('Download failed - file not found');
            }

            filePath = path.join(tempDir, files[0]);
            console.log(`✅ Audio downloaded: ${filePath}`);

            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`📦 File size: ${fileSizeMB} MB`);

            // Check if file is too large (WhatsApp limit is ~100MB for audio)
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
            
            if (error.message.includes('yt-dlp not installed')) {
                errorMessage += '⚠️ *yt-dlp is not installed*\n\n';
                errorMessage += '*Installation:*\n';
                errorMessage += '```\nsudo apt update\nsudo apt install yt-dlp\n```\n\n';
                errorMessage += '*Or using pip:*\n';
                errorMessage += '```\npip install yt-dlp\n```';
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage += 'Download took too long. The video might be too large or connection is slow.';
            } else if (error.message.includes('age')) {
                errorMessage += 'This video is age-restricted.';
            } else if (error.message.includes('unavailable') || error.message.includes('private')) {
                errorMessage += 'Video is unavailable or private.';
            } else if (error.message.includes('copyright')) {
                errorMessage += 'This video has copyright restrictions.';
            } else if (error.message.includes('too large')) {
                errorMessage += 'Audio file is too large to send via WhatsApp (max 100MB).';
            } else if (error.message.includes('Command failed')) {
                errorMessage += 'yt-dlp failed to download. The video might be restricted or unavailable.\n\n';
                errorMessage += 'Try a different song or check if yt-dlp is updated:\n```\npip install -U yt-dlp\n```';
            } else {
                errorMessage += `*Error:* ${error.message}\n\nPlease try again or use a different song.`;
            }

            await sock.sendMessage(from, { text: errorMessage });
            
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