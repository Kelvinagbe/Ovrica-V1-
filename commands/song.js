// commands/song.js - Fixed YouTube Song Downloader
// Install: npm install @distube/ytdl-core yt-search

const fs = require('fs');
const path = require('path');

// Lazy load dependencies to prevent startup errors
let yts, ytdl;

// Store user selections temporarily
const userSelections = new Map();

module.exports = {
    name: 'song',
    admin: false,
    description: 'Search and download songs from YouTube',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            console.log('🎵 Song command executed');
            console.log('📝 Args:', args);

            // Load dependencies only when needed
            if (!yts || !ytdl) {
                try {
                    yts = require('yt-search');
                    ytdl = require('@distube/ytdl-core');
                    console.log('✅ Dependencies loaded');
                } catch (error) {
                    console.error('❌ Dependency error:', error.message);
                    return await sock.sendMessage(from, {
                        text: `❌ *Missing Dependencies*\n\n` +
                            `📦 Please install:\n` +
                            `npm install @distube/ytdl-core yt-search\n\n` +
                            `Error: ${error.message}`
                    }, { quoted: msg });
                }
            }

            // Check if user is selecting download type (1 for audio, 2 for video)
            if (args.length === 1 && (args[0] === '1' || args[0] === '2')) {
                const selection = userSelections.get(from);

                if (!selection) {
                    return await sock.sendMessage(from, {
                        text: `❌ *No song selected!*\n\n` +
                            `📝 First search for a song:\n` +
                            `/song [song name]\n\n` +
                            `Then choose 1 or 2`
                    }, { quoted: msg });
                }

                const downloadType = args[0] === '1' ? 'audio' : 'video';
                await downloadMedia(sock, from, msg, selection.video, downloadType, ytdl);
                userSelections.delete(from); // Clear selection
                return;
            }

            // Check if user provided a song name
            if (!args[0]) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SONG DOWNLOADER ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 🎵 *Download Songs & Videos*\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n` +
                        `│\n` +
                        `├◆ 📝 *Step 1 - Search:*\n` +
                        `├◆    /song [song name]\n` +
                        `│\n` +
                        `├◆ 📝 *Step 2 - Choose:*\n` +
                        `├◆    Reply with 1 or 2\n` +
                        `├◆    1️⃣ = Audio (MP3)\n` +
                        `├◆    2️⃣ = Video (MP4)\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n` +
                        `│\n` +
                        `├◆ /song Faded\n` +
                        `├◆ /song Shape of You Ed Sheeran\n` +
                        `├◆ /song Blinding Lights\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
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

            // Get song name from arguments
            const songName = args.join(' ');
            console.log(`🔍 Searching for: ${songName}`);

            // Send searching message
            const searchMsg = await sock.sendMessage(from, {
                text: `🔍 *Searching for:* ${songName}\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Search YouTube
            const search = await yts(songName);
            const video = search.videos[0];

            if (!video) {
                return await sock.sendMessage(from, {
                    text: `❌ *No results found!*\n\n` +
                        `📝 Try:\n` +
                        `• Different song name\n` +
                        `• Add artist name\n` +
                        `• Check spelling\n\n` +
                        `Example: /song Faded Alan Walker`,
                    edit: searchMsg.key
                });
            }

            console.log(`✅ Found: ${video.title}`);

            // Check video duration (limit to 10 minutes)
            const durationSeconds = video.timestamp.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            if (durationSeconds > 600) {
                return await sock.sendMessage(from, {
                    text: `❌ *Song too long!*\n\n` +
                        `📝 Found: ${video.title}\n` +
                        `⏱️ Duration: ${video.timestamp}\n` +
                        `⚠️ Maximum: 10 minutes\n\n` +
                        `💡 Try a shorter song`,
                    edit: searchMsg.key
                });
            }

            // Store selection for this user
            userSelections.set(from, { video, timestamp: Date.now() });

            // Clear old selections (older than 5 minutes)
            const now = Date.now();
            for (const [key, value] of userSelections.entries()) {
                if (now - value.timestamp > 300000) { // 5 minutes
                    userSelections.delete(key);
                }
            }

            // Send song info and ask for choice
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ SONG FOUND ⌟* ❏\n` +
                    `│\n` +
                    `├◆ 🎵 *Title:* ${video.title}\n` +
                    `├◆ 👤 *Artist:* ${video.author.name}\n` +
                    `├◆ ⏱️ *Duration:* ${video.timestamp}\n` +
                    `├◆ 👁️ *Views:* ${video.views.toLocaleString()}\n` +
                    `├◆ 📅 *Uploaded:* ${video.ago}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `┌ ❏ ◆ *⌜CHOOSE FORMAT⌟* ◆\n` +
                    `│\n` +
                    `├◆ 1️⃣ *Audio* (MP3) - Music only\n` +
                    `├◆ 2️⃣ *Video* (MP4) - With video\n` +
                    `│\n` +
                    `├◆ 📝 Reply with: /song 1 or /song 2\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: `${video.author.name} • ${video.timestamp}`,
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: video.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                },
                edit: searchMsg.key
            });

        } catch (error) {
            console.error('❌ Song search error:', error);

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Search failed*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n` +
                    `│\n` +
                    `├◆ 💡 Try:\n` +
                    `├◆    • Different song name\n` +
                    `├◆    • Check spelling\n` +
                    `├◆    • Try again later\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};

async function downloadMedia(sock, from, msg, video, type, ytdl) {
    const processingMsg = await sock.sendMessage(from, {
        text: `⏳ *Downloading ${type}...*\n\n` +
            `🎵 ${video.title}\n` +
            `⏱️ ${video.timestamp}\n\n` +
            `📥 Please wait, this may take a moment...`
    }, { quoted: msg });

    try {
        console.log(`📥 Downloading ${type}: ${video.url}`);

        // Validate ytdl-core is working
        if (!ytdl || !ytdl.getInfo) {
            throw new Error('ytdl-core not properly loaded');
        }

        // Get video info first to validate
        const info = await ytdl.getInfo(video.url);
        console.log('✅ Video info retrieved');

        const options = type === 'audio' 
            ? { filter: 'audioonly', quality: 'highestaudio' }
            : { filter: 'videoandaudio', quality: 'highest' };

        const stream = ytdl(video.url, options);

        // Create temp directory
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            console.log('📁 Temp directory created');
        }

        const extension = type === 'audio' ? 'mp3' : 'mp4';
        const fileName = `${type}_${Date.now()}.${extension}`;
        const filePath = path.join(tempDir, fileName);
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream);

        // Handle download completion
        writeStream.on('finish', async () => {
            console.log(`✅ Downloaded: ${fileName}`);

            try {
                const fileBuffer = fs.readFileSync(filePath);
                const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

                // Check file size (WhatsApp limit ~100MB)
                if (fileBuffer.length > 100 * 1024 * 1024) {
                    fs.unlinkSync(filePath);
                    return await sock.sendMessage(from, {
                        text: `❌ *File too large!*\n\n` +
                            `📦 Size: ${fileSizeMB} MB\n` +
                            `⚠️ Maximum: 100 MB\n\n` +
                            `💡 Try:\n` +
                            `• Shorter video\n` +
                            `• Audio only (option 1)`,
                        edit: processingMsg.key
                    });
                }

                // Send based on type
                if (type === 'audio') {
                    await sock.sendMessage(from, {
                        audio: fileBuffer,
                        mimetype: 'audio/mpeg',
                        fileName: `${video.title}.mp3`,
                        contextInfo: {
                            externalAdReply: {
                                title: video.title,
                                body: `${video.author.name} • ${video.timestamp}`,
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
                        caption: `┌ ❏ *⌜ VIDEO ⌟* ❏\n` +
                            `│\n` +
                            `├◆ 🎵 *Title:* ${video.title}\n` +
                            `├◆ 👤 *Artist:* ${video.author.name}\n` +
                            `├◆ ⏱️ *Duration:* ${video.timestamp}\n` +
                            `├◆ 📦 *Size:* ${fileSizeMB} MB\n` +
                            `│\n` +
                            `└ ❏\n` +
                            `> Powered by 🎭Kelvin🎭`,
                        mimetype: 'video/mp4'
                    });
                }

                // Update message
                await sock.sendMessage(from, {
                    text: `✅ *${type === 'audio' ? 'Audio' : 'Video'} sent!*\n\n` +
                        `🎵 ${video.title}\n` +
                        `📦 Size: ${fileSizeMB} MB`,
                    edit: processingMsg.key
                });

                // Delete temp file
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted: ${fileName}`);

            } catch (sendError) {
                console.error('❌ Send error:', sendError);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                throw sendError;
            }
        });

        writeStream.on('error', (error) => {
            console.error('❌ Write error:', error);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw error;
        });

        stream.on('error', (error) => {
            console.error('❌ Stream error:', error);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw error;
        });

    } catch (error) {
        console.error('❌ Download error:', error);

        let errorMsg = error.message;
        let errorSolution = 'Try again';

        if (error.message.includes('403') || error.message.includes('410')) {
            errorMsg = 'Video restricted or unavailable';
            errorSolution = 'This video cannot be downloaded from YouTube';
        } else if (error.message.includes('ENOSPC')) {
            errorMsg = 'No storage space';
            errorSolution = 'Server storage full';
        } else if (error.message.includes('Sign in')) {
            errorMsg = 'YouTube sign-in required';
            errorSolution = 'This video requires authentication';
        }

        await sock.sendMessage(from, {
            text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                `│\n` +
                `├◆ ❌ *Download failed*\n` +
                `├◆ 📝 *Error:* ${errorMsg}\n` +
                `├◆ 💡 *Solution:* ${errorSolution}\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 🎭Kelvin🎭`,
            edit: processingMsg.key
        });
    }
}