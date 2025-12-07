const gis = require('g-i-s');
const { templates } = require('../tmp/templates');
const axios = require('axios');

module.exports = {
    name: 'image',
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

                // Try to download and send images until one works
                let imageSuccess = false;
                
                for (let i = 0; i < Math.min(results.length, 10); i++) {
                    try {
                        const imageUrl = results[i].url;
                        
                        console.log(`Trying image ${i + 1}: ${imageUrl}`);

                        // Download image with timeout
                        const response = await axios.get(imageUrl, {
                            responseType: 'arraybuffer',
                            timeout: 10000,
                            maxContentLength: 10 * 1024 * 1024, // 10MB max
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                            }
                        });

                        const imageBuffer = Buffer.from(response.data);

                        // Validate image size
                        if (imageBuffer.length < 100) {
                            console.log(`Image ${i + 1} too small, skipping...`);
                            continue;
                        }

                        // Prepare caption
                        const caption = `🖼️ *Image Result*\n\n` +
                                      `📝 Query: ${searchQuery}\n` +
                                      `🔢 Result: ${i + 1} of ${results.length}\n` +
                                      `🔗 Source: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}\n\n` +
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

                        imageSuccess = true;
                        console.log(`✅ Successfully sent image ${i + 1}`);
                        break; // Exit loop after successful send

                    } catch (downloadError) {
                        console.log(`❌ Failed to download image ${i + 1}:`, downloadError.message);
                        // Continue to next image
                        continue;
                    }
                }

                // If no image could be downloaded, send URL list as fallback
                if (!imageSuccess) {
                    console.log('⚠️ All image downloads failed, sending URL list');
                    
                    let imageList = `🖼️ *Found ${results.length} images for: ${searchQuery}*\n\n`;
                    imageList += `❌ Could not download images. Here are the URLs:\n\n`;
                    
                    results.slice(0, 5).forEach((img, i) => {
                        imageList += `${i + 1}. ${img.url}\n\n`;
                    });
                    
                    imageList += `💡 Tip: Try searching again or use a different query.\n\n`;
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