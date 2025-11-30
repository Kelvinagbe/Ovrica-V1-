// commands/txt2img.js - AI Image Generator with Text Watermark

const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Image size presets
const SIZE_PRESETS = {
    '1': { name: 'Square', width: 1024, height: 1024, emoji: '⬛' },
    '2': { name: 'Portrait', width: 768, height: 1024, emoji: '📱' },
    '3': { name: 'Landscape', width: 1024, height: 768, emoji: '🖼️' },
    '4': { name: 'Wide', width: 1280, height: 720, emoji: '🎬' },
    '5': { name: 'Ultra Wide', width: 1920, height: 1080, emoji: '🖥️' }
};

// Load config
const configPath = path.join(__dirname, '../config/api-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const API_BASE_URL = Buffer.from(config.x5c, 'base64').toString('utf-8');
const WATERMARK_TEXT = Buffer.from(config.x5d, 'base64').toString('utf-8');

// Create SVG text watermark
function createTextWatermark(width, height) {
    const fontSize = Math.floor(width * 0.04);
    const padding = Math.floor(width * 0.02);

    return Buffer.from(`
        <svg width="${width}" height="${height}">
            <defs>
                <style>
                    .watermark-text {
                        font-family: Arial, sans-serif;
                        font-size: ${fontSize}px;
                        font-weight: bold;
                        fill: white;
                        fill-opacity: 0.5;
                        stroke: black;
                        stroke-width: 2;
                        stroke-opacity: 0.6;
                    }
                </style>
            </defs>
            <text 
                x="${width - padding}" 
                y="${height - padding}" 
                text-anchor="end" 
                class="watermark-text">${WATERMARK_TEXT}</text>
        </svg>
    `);
}

// Add watermark to image
async function addWatermark(imageBuffer, width, height) {
    try {
        const watermark = createTextWatermark(width, height);

        return await sharp(imageBuffer)
            .composite([{ input: watermark, gravity: 'southeast' }])
            .jpeg({ quality: 90 })
            .toBuffer();

    } catch (error) {
        console.error('⚠️ Watermark failed:', error.message);
        return imageBuffer;
    }
}

module.exports = {
    name: 'txt2img',
    admin: false,
    description: '🎨 Generate AI images from text prompts',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            // Show usage if no args
            if (args.length < 2) {
                return await sendWithTyping(sock, from,
                    `🎨 *AI Image Generator*\n\n` +
                    `📝 *Usage:* /txt2img [size] [prompt]\n\n` +
                    `*Sizes:*\n` +
                    `⬛ 1 - Square (1024x1024)\n` +
                    `📱 2 - Portrait (768x1024)\n` +
                    `🖼️ 3 - Landscape (1024x768)\n` +
                    `🎬 4 - Wide (1280x720)\n` +
                    `🖥️ 5 - Ultra Wide (1920x1080)\n\n` +
                    `*Example:*\n` +
                    `/txt2img 1 beautiful sunset over ocean`
                );
            }

            const sizeChoice = args[0];
            const prompt = args.slice(1).join(' ');

            // Validate size
            const size = SIZE_PRESETS[sizeChoice];
            if (!size) {
                return await sendWithTyping(sock, from,
                    `❌ Invalid size! Choose 1-5\n\n` +
                    `Type /txt2img to see available sizes`
                );
            }

            // Validate prompt
            if (prompt.length < 3) {
                return await sendWithTyping(sock, from,
                    `❌ Prompt too short!\n\n` +
                    `Please provide a detailed description`
                );
            }

            // Generating message
            await sendWithTyping(sock, from,
                `🎨 *Generating Image...*\n\n` +
                `📝 ${prompt}\n` +
                `${size.emoji} ${size.name} (${size.width}x${size.height})\n\n` +
                `⏳ Please wait...`
            );

            // Generate image using config
            const imageUrl = `${API_BASE_URL}${encodeURIComponent(prompt)}?width=${size.width}&height=${size.height}&nologo=true&seed=${Date.now()}`;

            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 60000
            });

            // Add watermark
            const imageBuffer = Buffer.from(response.data);
            const watermarkedImage = await addWatermark(imageBuffer, size.width, size.height);

            // Send image
            await sock.sendMessage(from, {
                image: watermarkedImage,
                caption: `🎨 *Powered by Ovrica AI*`,
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

            console.log(`✅ Generated: ${prompt} | ${size.name}`);

        } catch (error) {
            console.error('❌ Generation error:', error.message);

            let errorMsg = '❌ *Generation Failed*\n\n';

            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMsg += '⏱️ Request timed out\n💡 Try a simpler prompt';
            } else if (error.response?.status === 400) {
                errorMsg += '🚫 Invalid prompt\n💡 Try different wording';
            } else {
                errorMsg += `⚠️ ${error.message}\n💡 Try again later`;
            }

            await sendWithTyping(sock, from, errorMsg);
        }
    }
};