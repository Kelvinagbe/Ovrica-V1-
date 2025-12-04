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
            filePath = path.join(tempDir, `${timestamp}_${sanitizedTitle}.mp3`);
            
            console.log('📥 Downloading audio using API...');

            // Try multiple APIs in order
            let downloadUrl = null;
            let apiUsed = null;

            // API 1: Try using a YouTube downloader API
            try {
                console.log('Trying API 1...');
                const api1Response = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.y2mate.com/mates/analyzeV2/ajax`)}&id=${videoId}&k_page=home`, {
                    timeout: 15000
                });
                
                if (api1Response.data && api1Response.data.url) {
                    downloadUrl = api1Response.data.url;
                    apiUsed = 'API 1';
                }
            } catch (error) {
                console.log('API 1 failed:', error.message);
            }

            // API 2: Try using direct YouTube download
            if (!downloadUrl) {
                try {
                    console.log('Trying API 2...');
                    const api2Response = await axios.get(`https://api.vevioz.com/api/button/mp3/${videoId}`, {
                        timeout: 15000
                    });
                    
                    if (api2Response.data && api2Response.data.dlink) {
                        downloadUrl = api2Response.data.dlink;
                        apiUsed = 'API 2';
                    }
                } catch (error) {
                    console.log('API 2 failed:', error.message);
                }
            }

            // API 3: Fallback to another service
            if (!downloadUrl) {
                try {
                    console.log('Trying API 3...');
                    const api3Response = await axios.post('https://mp3-download.to/api/ajax/convert', 
                        `videoid=${videoId}&downtype=mp3&vquality=128`,
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            timeout: 15000
                        }
                    );
                    
                    if (api3Response.data && api3Response.data.url) {
                        downloadUrl = api3Response.data.url;
                        apiUsed = 'API 3';
                    }
                } catch (error) {
                    console.log('API 3 failed:', error.message);
                }
            }

            // If no API worked, throw error
            if (!downloadUrl) {
                throw new Error('All download services are currently unavailable. Please try again later or use a different song.');
            }

            console.log(`✅ Got download URL from ${apiUsed}`);
            console.log('📥 Downloading audio file...');

            // Download the audio file
            const audioResponse = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 60000, // 60 seconds timeout
                maxContentLength: 100 * 1024 * 1024, // 100MB max
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const writer = fs.createWriteStream(filePath);
            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
                
                // Timeout after 2 minutes
                setTimeout(() => {
                    reject(new Error('Download timeout'));
                }, 120000);
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
            
            if (error.message.includes('All download services')) {
                errorMessage += error.message;
            } else if (error.response) {
                errorMessage += `API Error: ${error.response.status}\n\n`;
                errorMessage += 'The download service is unavailable. Try again in a few minutes.';
            } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorMessage += 'Download took too long. Try a shorter video.';
            } else if (error.message.includes('too large')) {
                errorMessage += 'Audio file is too large (max 100MB).';
            } else if (error.message.includes('empty')) {
                errorMessage += 'Download failed. The video might be restricted or unavailable.';
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