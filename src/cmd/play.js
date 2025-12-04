const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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
            const videoId = video.videoId;
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
                        sourceUrl: `https://youtube.com/watch?v=${videoId}`,
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
            filePath = path.join(tempDir, `${timestamp}_${sanitizedTitle}.mp3`);
            
            console.log('📥 Downloading audio using external API...');

            // Use a free YouTube download API
            const apiUrl = `https://api.cobalt.tools/api/json`;
            
            const response = await axios.post(apiUrl, {
                url: `https://youtube.com/watch?v=${videoId}`,
                vCodec: 'h264',
                vQuality: '720',
                aFormat: 'mp3',
                isAudioOnly: true
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status !== 'stream' && response.data.status !== 'redirect') {
                throw new Error('Failed to get download link from API');
            }

            const downloadUrl = response.data.url;
            console.log('📥 Downloading from:', downloadUrl);

            // Download the audio file
            const audioResponse = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);
            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`✅ Audio downloaded: ${filePath}`);

            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`📦 File size: ${fileSizeMB} MB`);

            // Check if file is too large
            if (stats.size > 100 * 1024 * 1024) {
                throw new Error('File is too large to send via WhatsApp (max 100MB)');
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
                        sourceUrl: `https://youtube.com/watch?v=${videoId}`,
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
            
            if (error.response) {
                errorMessage += `API Error: ${error.response.status}\n\n`;
                errorMessage += 'The download service is unavailable. Try again later.';
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage += 'Download took too long. Try a shorter video.';
            } else if (error.message.includes('too large')) {
                errorMessage += 'Audio file is too large (max 100MB).';
            } else {
                errorMessage += `*Error:* ${error.message}\n\nPlease try a different song.`;
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