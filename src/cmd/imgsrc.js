const gis = require('g-i-s');
const { templates } = require('../tmp/templates');
const axios = require('axios');

module.exports = {
    name: 'imgsrch',
    aliases: ['img', 'gimage'],
    description: 'Search and download images from Google',
    usage: '.image <search query>',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Check if search query is provided
        if (args.length === 0) {
            const text = templates.error('Please provide a search query!\n\nUsage: .image <search term>\nExample: .image cute cats');
            return await sendWithTyping(sock, from, { text });
        }

        const searchQuery = args.join(' ');

        try {
            // Send searching message
            await sendWithTyping(sock, from, { 
                text: `🔍 Searching for images: *${searchQuery}*...` 
            });

            // Search Google Images
            gis(searchQuery, async (error, results) => {
                if (error) {
                    console.error('Google Image Search error:', error);
                    const text = templates.error(`Failed to search images: ${error.message}`);
                    return await sendWithTyping(sock, from, { text });
                }

                if (!results || results.length === 0) {
                    const text = templates.error('No images found for that search query.');
                    return await sendWithTyping(sock, from, { text });
                }

                try {
                    // Get first result
                    const imageUrl = results[0].url;

                    // Download image
                    const response = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    const imageBuffer = Buffer.from(response.data);

                    // Prepare caption
                    const caption = `🖼️ *Image Result*\n\n` +
                                  `📝 Query: ${searchQuery}\n` +
                                  `🔗 Source: ${results[0].url}\n\n` +
                                  `> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

                    // Send image
                    await sock.sendMessage(from, {
                        image: imageBuffer,
                        caption: caption,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363418958316196@newsletter",
                                newsletterName: "🎭 Kelvin Tech",
                                serverMessageId: 200
                            }
                        }
                    }, { quoted: msg });

                } catch (downloadError) {
                    console.error('Image download error:', downloadError);
                    
                    // If first image fails, send URL list instead
                    let imageList = `🖼️ *Found ${results.length} images for: ${searchQuery}*\n\n`;
                    results.slice(0, 5).forEach((img, i) => {
                        imageList += `${i + 1}. ${img.url}\n\n`;
                    });
                    imageList += `> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

                    await sendWithTyping(sock, from, { text: imageList });
                }
            });

        } catch (error) {
            console.error('Image command error:', error);
            const text = templates.error(`Failed to process image search: ${error.message}`);
            await sendWithTyping(sock, from, { text });
        }
    }
};