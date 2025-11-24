// commands/sticker.js - Convert image/video to sticker

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp'); // You'll need this: npm install sharp
const ffmpeg = require('fluent-ffmpeg'); // For video: npm install fluent-ffmpeg
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'sticker',
    admin: false,
    description: 'Convert image or video to sticker',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Check if user replied to a message
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ STICKER MAKER ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 🎨 *Convert to Sticker*\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n` +
                        `│\n` +
                        `├◆ 1️⃣ Send or forward an image/video\n` +
                        `├◆ 2️⃣ Reply to it with: /sticker\n` +
                        `├◆ 3️⃣ Wait for your sticker!\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜SUPPORTED⌟* ◆\n` +
                        `│\n` +
                        `├◆ 🖼️ Images (JPG, PNG, WEBP)\n` +
                        `├◆ 🎥 Videos (MP4, max 10 seconds)\n` +
                        `├◆ 📏 Auto-resize to sticker format\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n` +
                        `│\n` +
                        `├◆ Reply to image: /sticker\n` +
                        `├◆ Reply to video: /sticker\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: "🎨 Sticker Maker",
                            body: "Convert images & videos to stickers",
                            thumbnailUrl: "https://i.ibb.co/0FksjQz/icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            // Check if it's an image or video
            const isImage = quotedMsg.imageMessage;
            const isVideo = quotedMsg.videoMessage;

            if (!isImage && !isVideo) {
                return await sock.sendMessage(from, {
                    text: `❌ *Please reply to an image or video*\n\n` +
                        `📝 Supported formats:\n` +
                        `• Images: JPG, PNG, WEBP\n` +
                        `• Videos: MP4, GIF (max 10 seconds)`
                }, { quoted: msg });
            }

            // Send processing message
            const processingMsg = await sock.sendMessage(from, {
                text: `⏳ Creating sticker...\n${isVideo ? '🎥 Processing video' : '🖼️ Processing image'}`
            }, { quoted: msg });

            // Download media
            const buffer = await downloadMediaMessage(
                { message: quotedMsg },
                'buffer',
                {}
            );

            console.log(`🎨 Creating ${isVideo ? 'video' : 'image'} sticker`);

            if (isImage) {
                // Process image sticker
                const processedBuffer = await processImageSticker(buffer);
                
                await sock.sendMessage(from, {
                    sticker: processedBuffer,
                    packname: '🤖 OVRICA-V1',
                    author: '🎭 Kelvin'
                });

            } else if (isVideo) {
                // Check video duration
                const videoSeconds = quotedMsg.videoMessage.seconds || 0;
                
                if (videoSeconds > 10) {
                    return await sock.sendMessage(from, {
                        text: `❌ *Video too long*\n\n` +
                            `📝 Current: ${videoSeconds} seconds\n` +
                            `⚠️ Maximum: 10 seconds\n\n` +
                            `💡 Tip: Trim your video first`,
                        edit: processingMsg.key
                    });
                }

                // Process video sticker
                const processedBuffer = await processVideoSticker(buffer);
                
                await sock.sendMessage(from, {
                    sticker: processedBuffer,
                    packname: '🤖 OVRICA-V1',
                    author: '🎭 Kelvin'
                });
            }

            // Update to success
            await sock.sendMessage(from, {
                text: `✅ *Sticker created successfully!*\n\n` +
                    `📦 Pack: 🤖 OVRICA-V1\n` +
                    `👤 Author: 🎭 Kelvin`,
                edit: processingMsg.key
            });

            console.log('✅ Sticker created successfully');

        } catch (error) {
            console.error('❌ Sticker error:', error);

            let errorMsg = error.message;
            let errorSolution = 'Try again with a different image';

            if (error.message.includes('large')) {
                errorMsg = 'File too large';
                errorSolution = 'Use a smaller image (max 2MB)';
            } else if (error.message.includes('format')) {
                errorMsg = 'Invalid format';
                errorSolution = 'Use JPG, PNG, or MP4';
            } else if (error.message.includes('download')) {
                errorMsg = 'Download failed';
                errorSolution = 'Media might be expired';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to create sticker*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `├◆ 🔧 *Tips:*\n` +
                    `├◆    • Use images under 2MB\n` +
                    `├◆    • Videos under 10 seconds\n` +
                    `├◆    • Supported: JPG, PNG, MP4\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};

// Process image to sticker format
async function processImageSticker(buffer) {
    try {
        // Resize and convert to WebP
        const processedBuffer = await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp()
            .toBuffer();

        return processedBuffer;
    } catch (error) {
        console.error('Image processing error:', error);
        // If sharp fails, return original buffer
        return buffer;
    }
}

// Process video to sticker format
async function processVideoSticker(buffer) {
    return new Promise((resolve, reject) => {
        const tempInput = path.join(__dirname, '../temp', `input_${Date.now()}.mp4`);
        const tempOutput = path.join(__dirname, '../temp', `output_${Date.now()}.webp`);

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write buffer to temp file
        fs.writeFileSync(tempInput, buffer);

        ffmpeg(tempInput)
            .outputOptions([
                '-vcodec libwebp',
                '-vf scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0',
                '-loop 0',
                '-preset default',
                '-an',
                '-vsync 0',
                '-s 512:512'
            ])
            .toFormat('webp')
            .on('end', () => {
                const outputBuffer = fs.readFileSync(tempOutput);
                // Cleanup
                fs.unlinkSync(tempInput);
                fs.unlinkSync(tempOutput);
                resolve(outputBuffer);
            })
            .on('error', (err) => {
                // Cleanup on error
                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                reject(err);
            })
            .save(tempOutput);
    });
}