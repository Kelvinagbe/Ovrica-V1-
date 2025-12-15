const axios = require('axios');

module.exports = {
    name: 'ytsearch',
    aliases: ['yts', 'searchyt', 'youtubesearch'],
    admin: false,
    description: 'Search YouTube and show download options',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const query = args.join(' ');

        if (!query) {
            return await sendWithTyping(sock, from, 
                `❌ Please provide a search query\n\n` +
                `*Usage:* /ytsearch [song name]\n` +
                `*Example:* /ytsearch faded alan walker`
            );
        }

        try {
            await sendWithTyping(sock, from, `🔍 Searching for: ${query}...`);

            const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`);
            const videos = searchResponse.data?.result;

            if (!Array.isArray(videos) || videos.length === 0) {
                return await sendWithTyping(sock, from, '❌ No results found');
            }

            const video = videos[0];
            const videoId = video.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];

            // Format duration
            const formatDuration = (seconds) => {
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            const duration = video.timestamp || formatDuration(video.seconds || 0);
            const views = video.views || 'N/A';
            const channel = video.author?.name || 'Unknown';

            // Create message with song details
            const caption = 
                `╔══════════════════╗\n` +
                `║ 🎵 *YOUTUBE SEARCH* 🎵\n` +
                `╚══════════════════╝\n\n` +
                `📌 *Title:* ${video.title}\n` +
                `👤 *Channel:* ${channel}\n` +
                `⏱️ *Duration:* ${duration}\n` +
                `👁️ *Views:* ${views}\n` +
                `🔗 *URL:* ${video.url}\n\n` +
                `📥 *Download Options:*\n` +
                `• Reply "1" for Audio 🎵\n` +
                `• Reply "2" for Video 🎥`;

            // Send with thumbnail and buttons
            const sentMsg = await sock.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: caption,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: `${channel} • ${duration}`,
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: video.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg });

            // Store the video info temporarily for button responses
            // You can use a simple in-memory store or database
            global.pendingDownloads = global.pendingDownloads || {};
            global.pendingDownloads[from] = {
                url: video.url,
                title: video.title,
                thumbnail: video.thumbnail,
                videoId: videoId,
                timestamp: Date.now()
            };

            // Clean up after 5 minutes
            setTimeout(() => {
                if (global.pendingDownloads[from]) {
                    delete global.pendingDownloads[from];
                }
            }, 300000);

        } catch (error) {
            console.error("YouTube search error:", error);
            await sendWithTyping(sock, from, `❌ Error: ${error.message}`);
        }
    }
};