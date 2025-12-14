const axios = require('axios');

module.exports = {
    name: 'play',
    aliases: ['ytmp3', 'ytmp3doc', 'audiodoc', 'yta', 'song'],
    admin: false,
    description: 'Download audio from YouTube',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const q = args.join(' ');
        
        if (!q) {
            return await sendWithTyping(sock, from, `╔══[❏⧉ *🎵 PLAY COMMAND* ⧉❏]
║
║➲ Download YouTube audio/video
║
║ *Usage:*
║➲ /play [song name or URL]
║
║ *Examples:*
║➲ /play faded alan walker
║➲ /play https://youtu.be/xxxxx
║
╚══━━━━━━━━━━━━⧉❏]`);
        }

        try {
            let videoUrl;
            let videoTitle;
            let videoThumbnail;

            if (q.match(/(youtube\.com|youtu\.be)/i)) {
                videoUrl = q;
                const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
                if (!videoId) {
                    return await sendWithTyping(sock, from, '❌ Invalid YouTube URL');
                }
                videoTitle = "YouTube Audio";
                videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            } else {
                const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(q)}`);
                const videos = searchResponse.data?.result;
                
                if (!Array.isArray(videos) || videos.length === 0) {
                    return await sendWithTyping(sock, from, '❌ No results found');
                }

                const firstVideo = videos[0];
                videoUrl = firstVideo.url;
                videoTitle = firstVideo.title;
                videoThumbnail = firstVideo.thumbnail;
            }

            await sendWithTyping(sock, from, `⏳ Downloading: ${videoTitle}\n\nPlease wait...`);

            const downloadResponse = await axios.get(`https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}`);
            const downloadUrl = downloadResponse.data?.result;
            
            if (!downloadUrl) {
                return await sendWithTyping(sock, from, '❌ Download failed. Try again later.');
            }

            const fileName = `${videoTitle}.mp3`.replace(/[^\w\s.-]/gi, '');

            const contextInfo = {
                externalAdReply: {
                    title: videoTitle,
                    body: 'Powered by Keith API',
                    mediaType: 1,
                    sourceUrl: videoUrl,
                    thumbnailUrl: videoThumbnail,
                    renderLargerThumbnail: false
                }
            };

            await sock.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: "audio/mpeg",
                fileName,
                contextInfo
            }, { quoted: msg });

            await sock.sendMessage(from, {
                document: { url: downloadUrl },
                mimetype: "audio/mpeg",
                fileName,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        ...contextInfo.externalAdReply,
                        body: 'Document version - Powered by Keith API'
                    }
                }
            }, { quoted: msg });

        } catch (error) {
            console.error("Play command error:", error);
            await sendWithTyping(sock, from, `❌ Error: ${error.message}`);
        }
    }
};