const YTMusic = require('node-youtube-music').default;
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ytDlp = new YTDlpWrap();

module.exports = {
    name: 'play',
    admin: false,
    description: 'Play a song from YouTube',

    exec: async (sock, from, args, msg, isAdmin) => {
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

            // Search with timeout
            const searchResults = await Promise.race([
                YTMusic.searchMusics(songName),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Search timeout')), 15000)
                )
            ]);

            if (!searchResults || searchResults.length === 0) {
                return await sock.sendMessage(from, {
                    text: `❌ No results found for: *${songName}*\n\nPlease try a different search term.`
                }, { quoted: msg });
            }

            const song = searchResults[0];
            const videoId = song.youtubeId;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const title = song.title || song.name;
            const artist = song.artists?.map(a => a.name).join(', ') || song.artist || 'Unknown Artist';
            const duration = song.duration?.label || 'Unknown';
            
            // Get best quality thumbnail
            let thumbnail = song.thumbnailUrl;
            if (!thumbnail || thumbnail.includes('default.jpg')) {
                thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }

            // Validate thumbnail URL
            try {
                await axios.head(thumbnail);
            } catch {
                thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }

            const infoMessage = 
                `┌ ❏ *⌜ SONG INFO ⌟* ❏\n` +
                `│\n` +
                `├◆ 🎵 *Title:* ${title}\n` +
                `├◆ 👤 *Artist:* ${artist}\n` +
                `├◆ ⏱️ *Duration:* ${duration}\n` +
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
                        body: `${artist} • ${duration}`,
                        thumbnail: { url: thumbnail },
                        sourceUrl: videoUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg });

            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const fileName = `${Date.now()}`;
            const outputPath = path.join(tempDir, fileName);

            // Download with yt-dlp
            await ytDlp.execPromise([
                videoUrl,
                '-f', 'bestaudio[ext=m4a]/bestaudio',
                '-x',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', `${outputPath}.%(ext)s`,
                '--no-playlist',
                '--embed-thumbnail',
                '--add-metadata',
                '--no-warnings',
                '--ignore-errors'
            ]);

            // Find the downloaded file
            const files = fs.readdirSync(tempDir).filter(f => f.startsWith(fileName));
            if (files.length === 0) {
                throw new Error('No file was downloaded');
            }

            const filePath = path.join(tempDir, files[0]);
            console.log(`✅ Audio downloaded: ${filePath}`);

            if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
                throw new Error('Download failed or file is empty');
            }

            await sock.sendMessage(from, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: artist,
                        thumbnail: { url: thumbnail },
                        sourceUrl: videoUrl,
                        mediaType: 2,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });

            console.log(`🎵 Audio sent to ${from}: ${title}`);

            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Cleaned up: ${filePath}`);
                }
            }, 5000);

        } catch (error) {
            console.error('❌ Play command error:', error);
            
            let errorMessage = '❌ Failed to download the song.\n\n';
            
            if (error.message.includes('timeout')) {
                errorMessage += 'Search took too long. Please try again.';
            } else if (error.message.includes('age')) {
                errorMessage += 'This video is age-restricted.';
            } else if (error.message.includes('unavailable') || error.message.includes('private')) {
                errorMessage += 'Video is unavailable or private.';
            } else if (error.message.includes('copyright')) {
                errorMessage += 'This video has copyright restrictions.';
            } else {
                errorMessage += 'Please try again or use a different song.';
            }

            await sock.sendMessage(from, { text: errorMessage });
        }
    }
};