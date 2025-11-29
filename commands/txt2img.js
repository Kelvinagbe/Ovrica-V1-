// commands/txt2img.js - Text to Image Generator with Sharp Logo Watermark

const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Available size presets
const SIZE_PRESETS = {
    '1': { name: 'Square', width: 1024, height: 1024, emoji: '⬛' },
    '2': { name: 'Portrait', width: 768, height: 1024, emoji: '📱' },
    '3': { name: 'Landscape', width: 1024, height: 768, emoji: '🖼️' },
    '4': { name: 'Wide', width: 1280, height: 720, emoji: '🎬' },
    '5': { name: 'Ultra Wide', width: 1920, height: 1080, emoji: '🖥️' }
};

// Function to add logo watermark using Sharp
async function addLogoWatermark(imageBuffer, width, height) {
    try {
        // Path to your watermark logo
        const logoPath = path.join(__dirname, '../assets/app.png');
        
        // Check if logo exists
        if (!fs.existsSync(logoPath)) {
            console.warn('⚠️ Watermark logo not found, skipping watermark');
            return imageBuffer;
        }
        
        // Calculate logo size (10% of image width)
        const logoWidth = Math.floor(width * 0.1);
        
        // Resize logo and add opacity
        const watermarkLogo = await sharp(logoPath)
            .resize(logoWidth, null, { fit: 'contain' })
            .composite([{
                input: Buffer.from([255, 255, 255, Math.floor(255 * 0.5)]), // 50% opacity
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                blend: 'dest-in'
            }])
            .toBuffer();
        
        // Add watermark to bottom-right corner
        const watermarkedImage = await sharp(imageBuffer)
            .composite([{
                input: watermarkLogo,
                gravity: 'southeast',
                blend: 'over'
            }])
            .jpeg({ quality: 90 })
            .toBuffer();
        
        return watermarkedImage;
        
    } catch (error) {
        console.error('⚠️ Watermark error:', error.message);
        return imageBuffer;
    }
}

module.exports = {
    name: 'txt2img',
    admin: false,
    description: 'Generate images from text prompts',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            // Check if args provided
            if (args.length < 2) {
                return await sendWithTyping(
                    sock,
                    from,
                    `🎨 *Text to Image Generator*\n\n` +
                    `📝 *Usage:* /txt2img [size] [prompt]\n\n` +
                    `*Available Sizes:*\n` +
                    `⬛ *1* - Square (1024x1024)\n` +
                    `📱 *2* - Portrait (768x1024)\n` +
                    `🖼️ *3* - Landscape (1024x768)\n` +
                    `🎬 *4* - Wide (1280x720)\n` +
                    `🖥️ *5* - Ultra Wide (1920x1080)\n\n` +
                    `*Example:*\n` +
                    `/txt2img 1 a beautiful sunset over mountains`
                );
            }

            // Get size and prompt
            const sizeChoice = args[0];
            const prompt = args.slice(1).join(' ');

            // Validate size
            const size = SIZE_PRESETS[sizeChoice];
            if (!size) {
                return await sendWithTyping(
                    sock,
                    from,
                    '❌ Invalid size! Please choose 1-5\n\n' +
                    'Use `/txt2img` without arguments to see available sizes.'
                );
            }

            // Validate prompt
            if (prompt.length < 3) {
                return await sendWithTyping(
                    sock,
                    from,
                    '❌ *Prompt too short!*\n\nPlease provide a more detailed description.'
                );
            }

            // Show generating message
            await sendWithTyping(
                sock,
                from,
                `🎨 *Generating Image...*\n\n` +
                `📝 *Prompt:* ${prompt}\n` +
                `${size.emoji} *Size:* ${size.name} (${size.width}x${size.height})\n\n` +
                `⏳ Please wait...`
            );

            // Generate image URL
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size.width}&height=${size.height}&nologo=true&seed=${Date.now()}`;

            // Download image
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 60000
            });

            const buffer = Buffer.from(response.data);

            // Add logo watermark to image
            const watermarkedBuffer = await addLogoWatermark(buffer, size.width, size.height);

            // Simple caption
            const caption = `🎨 *Powered by Ovrica AI*`;

            // Send image
            await sock.sendMessage(from, {
                image: watermarkedBuffer,
                caption: caption,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "🎨 Ovrica AI Image Generator",
                        body: "OVRICA WhatsApp Bot",
                        thumbnailUrl: "https://files.catbox.moe/0r5agb.jpg",
                        sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });

            console.log(`✅ Image generated: ${prompt} | Size: ${size.name}`);

        } catch (error) {
            console.error('❌ Image generation error:', error);

            let errorMessage = '❌ *Image Generation Failed!*\n\n';

            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMessage += '📝 *Reason:* Request timeout\n' +
                    '💡 *Try:* Simpler prompt or try again';
            } else if (error.response?.status === 400) {
                errorMessage += '📝 *Reason:* Invalid prompt\n' +
                    '💡 *Try:* Use a different description';
            } else {
                errorMessage += `📝 *Reason:* ${error.message}\n\n` +
                    '💡 *Try:* Different prompt or try again later';
            }

            await sendWithTyping(sock, from, errorMessage);
        }
    }
};