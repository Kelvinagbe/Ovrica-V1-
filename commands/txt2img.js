// commands/txt2img.js - Text to Image Generator with Size Selection

const axios = require('axios');

// Available size presets
const SIZE_PRESETS = {
    '1': { name: 'Square', width: 1024, height: 1024, emoji: '⬛' },
    '2': { name: 'Portrait', width: 768, height: 1024, emoji: '📱' },
    '3': { name: 'Landscape', width: 1024, height: 768, emoji: '🖼️' },
    '4': { name: 'Wide', width: 1280, height: 720, emoji: '🎬' },
    '5': { name: 'Ultra Wide', width: 1920, height: 1080, emoji: '🖥️' }
};

// Store user sessions - EXPORT THIS so main handler can access it
const userSessions = new Map();

// Function to generate image - EXPORT THIS
async function generateImage(sock, from, msg, prompt, sizeChoice) {
    const size = SIZE_PRESETS[sizeChoice];
    
    if (!size) {
        await sock.sendMessage(from, {
            text: '❌ Invalid size! Please choose 1-5'
        });
        return false;
    }
    
    try {
        // Show generating message
        await sock.sendMessage(from, {
            text: `🎨 *Generating Image...*\n\n` +
                `📝 *Prompt:* ${prompt}\n` +
                `${size.emoji} *Size:* ${size.name} (${size.width}x${size.height})\n\n` +
                `⏳ Please wait...`
        });
        
        // Generate image
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size.width}&height=${size.height}&nologo=true&seed=${Date.now()}`;
        
        // Download image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
        });
        
        const buffer = Buffer.from(response.data);
        
        // Send image with details
        const caption = `✅ *Image Generated Successfully!*\n\n` +
            `📝 *Prompt:* ${prompt}\n` +
            `${size.emoji} *Size:* ${size.name} (${size.width}x${size.height})\n` +
            `📊 *File Size:* ${(buffer.length / 1024).toFixed(2)} KB\n\n` +
            `━━━━━━━━━━━━━━━━━\n` +
            `🎨 *Powered by Pollinations AI*`;
        
        await sock.sendMessage(from, {
            image: buffer,
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
                    title: "🎨 AI Image Generator",
                    body: "OVRICA WhatsApp Bot",
                    thumbnailUrl: "https://files.catbox.moe/0r5agb.jpg",
                    sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: msg });
        
        console.log(`✅ Image generated for prompt: ${prompt} | Size: ${size.name}`);
        return true;
        
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
        
        await sock.sendMessage(from, { text: errorMessage });
        return false;
    }
}

module.exports = {
    name: 'txt2img',
    admin: false,
    description: 'Generate images from text prompts',
    userSessions: userSessions, // Export sessions
    generateImage: generateImage, // Export generate function
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const sender = msg.key.remoteJid;
            
            // If user provides prompt
            if (args.length === 0) {
                return await sendWithTyping(
                    sock,
                    from,
                    `🎨 *Text to Image Generator*\n\n` +
                    `📝 *Usage:* /txt2img [your prompt]\n\n` +
                    `*Example:*\n` +
                    `/txt2img a beautiful sunset over mountains\n\n` +
                    `━━━━━━━━━━━━━━━━━\n` +
                    `💡 After entering your prompt, you'll be asked to choose an image size!`
                );
            }
            
            // Get the prompt
            const prompt = args.join(' ');
            
            if (prompt.length < 3) {
                return await sendWithTyping(
                    sock,
                    from,
                    '❌ *Prompt too short!*\n\nPlease provide a more detailed description.'
                );
            }
            
            // Store session and ask for size
            userSessions.set(sender, { prompt, timestamp: Date.now() });
            
            // Send size selection message
            const sizeMessage = `🎨 *Choose Image Size*\n\n` +
                `📝 *Your Prompt:* ${prompt}\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `*Available Sizes:*\n\n` +
                `${SIZE_PRESETS['1'].emoji} *1.* ${SIZE_PRESETS['1'].name}\n` +
                `   📐 ${SIZE_PRESETS['1'].width}x${SIZE_PRESETS['1'].height} pixels\n` +
                `   ✅ Best for: Profile pics, Instagram posts\n\n` +
                `${SIZE_PRESETS['2'].emoji} *2.* ${SIZE_PRESETS['2'].name}\n` +
                `   📐 ${SIZE_PRESETS['2'].width}x${SIZE_PRESETS['2'].height} pixels\n` +
                `   ✅ Best for: Mobile wallpapers, stories\n\n` +
                `${SIZE_PRESETS['3'].emoji} *3.* ${SIZE_PRESETS['3'].name}\n` +
                `   📐 ${SIZE_PRESETS['3'].width}x${SIZE_PRESETS['3'].height} pixels\n` +
                `   ✅ Best for: Desktop wallpapers\n\n` +
                `${SIZE_PRESETS['4'].emoji} *4.* ${SIZE_PRESETS['4'].name}\n` +
                `   📐 ${SIZE_PRESETS['4'].width}x${SIZE_PRESETS['4'].height} pixels\n` +
                `   ✅ Best for: YouTube thumbnails\n\n` +
                `${SIZE_PRESETS['5'].emoji} *5.* ${SIZE_PRESETS['5'].name}\n` +
                `   📐 ${SIZE_PRESETS['5'].width}x${SIZE_PRESETS['5'].height} pixels\n` +
                `   ✅ Best for: Banners, covers\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `💡 *Reply with a number (1-5) to select size*\n` +
                `⏱️ This selection expires in 2 minutes`;
            
            await sock.sendMessage(from, {
                text: sizeMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "🎨 Select Image Size",
                        body: "Choose from 5 available sizes",
                        thumbnailUrl: "./icon.jpg",
                        sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });
            
            // Auto-clear session after 2 minutes
            setTimeout(() => {
                if (userSessions.has(sender)) {
                    userSessions.delete(sender);
                    console.log(`⏱️ Session expired for ${sender}`);
                }
            }, 120000); // 2 minutes
            
        } catch (error) {
            console.error('❌ txt2img command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred. Please try again!');
        }
    }
};

// Cleanup old sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [sender, session] of userSessions.entries()) {
        if (now - session.timestamp > 120000) { // 2 minutes
            userSessions.delete(sender);
        }
    }
}, 300000); // 5 minutes