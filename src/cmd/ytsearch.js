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
                `📥 *Choose download option below:*`;

            // Create interactive buttons
            const buttons = [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🎵 Download Audio",
                        id: `.play ${video.url}`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🎥 Download Video",
                        id: `.video ${video.url}`
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "▶️ Watch on YouTube",
                        url: video.url,
                        merchant_url: video.url
                    })
                }
            ];

            const interactiveMessage = {
                body: { text: caption },
                footer: { text: "Powered by Keith API" },
                header: {
                    title: "YouTube Search Result",
                    hasMediaAttachment: true,
                    imageMessage: await sock.prepareMessage(from, {
                        image: { url: video.thumbnail }
                    }, { upload: sock.waUploadToServer }).then(prep => prep.message.imageMessage)
                },
                nativeFlowMessage: {
                    buttons: buttons
                }
            };

            await sock.sendMessage(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { quoted: msg });

        } catch (error) {
            console.error("YouTube search error:", error);
            
            // Fallback to simple message if interactive buttons fail
            if (error.message.includes('interactive')) {
                try {
                    const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`);
                    const video = searchResponse.data?.result?.[0];
                    
                    if (video) {
                        const caption = 
                            `🎵 *${video.title}*\n\n` +
                            `👤 Channel: ${video.author?.name || 'Unknown'}\n` +
                            `⏱️ Duration: ${video.timestamp || 'N/A'}\n` +
                            `👁️ Views: ${video.views || 'N/A'}\n\n` +
                            `🔗 ${video.url}\n\n` +
                            `📥 *Download:*\n` +
                            `• Audio: /play ${video.url}\n` +
                            `• Video: /video ${video.url}`;

                        await sock.sendMessage(from, {
                            image: { url: video.thumbnail },
                            caption: caption
                        }, { quoted: msg });
                    }
                } catch (fallbackError) {
                    await sendWithTyping(sock, from, `❌ Error: ${error.message}`);
                }
            } else {
                await sendWithTyping(sock, from, `❌ Error: ${error.message}`);
            }
        }
    }
};