module.exports = {
    name: 'mainmenu',
    admin: false,
    description: 'Main commands',
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const text = `╔══[❏⧉ *📋 MAIN MENU* ⧉❏]
║
║ *Media Download:*
║➲ /play - Download audio/video
║➲ /ytmp3 - YouTube to MP3
║➲ /ytmp4 - YouTube to MP4
║➲ /song - Search & download
║➲ /video - Download video
║
║ *Search:*
║➲ /yts - YouTube search
║➲ /img - Image search
║➲ /google - Google search
║➲ /wiki - Wikipedia search
║
║ *Convert:*
║➲ /sticker - Create sticker
║➲ /toimg - Sticker to image
║➲ /tomp3 - Video to audio
║➲ /tovideo - Image to video
║
║ *Tools:*
║➲ /weather - Get weather
║➲ /translate - Translate text
║➲ /qr - Generate QR code
║➲ /tts - Text to speech
║
╚══━━━━━━━━━━━━⧉❏]`;
        
        await sock.sendMessage(from, {
            text: text,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363418958316196@newsletter",
                    newsletterName: "𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏",
                    serverMessageId: 200
                },
                externalAdReply: {
                    title: "📋 Main Menu",
                    body: "𝐎𝐕𝐑𝐈𝐂𝐀_𝐕𝟏 - Main Commands",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VarnKxpE93pumJ3TkH0M",
                    thumbnailUrl: "https://i.ibb.co/0QHxFwT/app.png"
                }
            }
        }, { quoted: msg });
    }
};
