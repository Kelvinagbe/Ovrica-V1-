const axios = require('axios');

module.exports = {
    name: 'video',
    aliases: ['ytmp4', 'ytvideo', 'ytv', 'getvideo'],
    admin: false,
    description: 'Download video from YouTube',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const q = args.join(' ');

        if (!q) {
            return await sendWithTyping(sock, from, 
                `❌ Please provide a YouTube URL\n\n` +
                `*Usage:* /video [YouTube URL]\n` +
                `*Example:* /video https://youtu.be/xxxxx`
            );
        }

        try {
            let videoUrl = q;
            
            if (!q.match(/(youtube\.com|youtu\.be)/i)) {
                return await sendWithTyping(sock, from, '❌ Please provide a valid YouTube URL');
            }

            const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
            if (!videoId) {
                return await sendWithTyping(sock, from, '❌ Invalid YouTube URL');
            }

            await sendWithTyping(sock, from, `⏳ Downloading video...\n\nPlease wait, this may take a moment...`);

            const downloadResponse = await axios.get(`https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(videoUrl)}`);
            const downloadUrl = downloadResponse.data?.result;

            if (!downloadUrl) {
                return await sendWithTyping(sock, from, '❌ Download failed. Try again later.');
            }

            const videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            const fileName = `video_${videoId}.mp4`;

            await sock.sendMessage(from, {
                video: { url: downloadUrl },
                caption: '✅ Video downloaded successfully',
                mimetype: 'video/mp4',
                fileName,
                contextInfo: {
                    externalAdReply: {
                        title: 'YouTube Video',
                        body: 'Powered by Keith API',
                        mediaType: 1,
                        sourceUrl: videoUrl,
                        thumbnailUrl: videoThumbnail,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });

        } catch (error) {
            console.error("Video download error:", error);
            await sendWithTyping(sock, from, `❌ Error: ${error.message}`);
        }
    }
};