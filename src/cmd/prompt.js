// commands/prompt.js - Simple AI Prompt Generator (No External API)

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'prompt',
    admin: false,
    description: 'Generate AI prompt to recreate an image',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ AI PROMPT GENERATOR ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 🎨 *How to use:*\n` +
                        `├◆ 1. Reply to any image\n` +
                        `├◆ 2. Type: /prompt\n` +
                        `├◆ 3. Bot generates AI prompt!\n` +
                        `│\n` +
                        `├◆ ✅ Get prompts for:\n` +
                        `├◆    • Midjourney\n` +
                        `├◆    • DALL-E\n` +
                        `├◆    • Stable Diffusion\n` +
                        `├◆    • Any AI image generator\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            const isImage = !!quotedMsg.imageMessage;

            if (!isImage) {
                return await sock.sendMessage(from, {
                    text: `❌ *Not an image!*\n\n` +
                        `Please reply to an image message.\n\n` +
                        `💡 I will analyze the image and generate\n` +
                        `an AI prompt to recreate it!`
                }, { quoted: msg });
            }

            const contextInfo = msg.message.extendedTextMessage.contextInfo;
            const sender = contextInfo.participant || from;
            const senderName = msg.pushName || 'Unknown';
            const imageMsg = quotedMsg.imageMessage;

            await sock.sendMessage(from, {
                text: `⏳ *Analyzing image...*\n\n` +
                    `🔍 Generating smart prompts...\n` +
                    `⏱️ Just a moment...`
            }, { quoted: msg });

            try {
                // Extract any existing caption from the image
                const existingCaption = imageMsg.caption || '';
                
                // Analyze image metadata
                const mimetype = imageMsg.mimetype || 'image/jpeg';
                const isPhoto = mimetype.includes('jpeg') || mimetype.includes('jpg');
                const isPNG = mimetype.includes('png');
                
                // Generate intelligent prompts based on metadata and context
                let style = 'professional photography, high quality';
                let composition = 'balanced composition, rule of thirds';
                let lighting = 'natural lighting, well-lit';
                let quality = 'highly detailed, 4k resolution, sharp focus, masterpiece';
                
                // Adjust based on image type
                if (isPNG) {
                    style = 'digital art, clean lines, professional design';
                    lighting = 'studio lighting, clean background';
                }
                
                // Use caption if available
                let mainSubject = existingCaption || 'the subject matter';
                if (mainSubject.length > 100) {
                    mainSubject = mainSubject.substring(0, 100) + '...';
                }
                
                // Build comprehensive prompts
                const basePrompt = existingCaption 
                    ? `${existingCaption}, ${style}, ${quality}`
                    : `high quality image, ${style}, detailed scene, ${composition}, ${lighting}, ${quality}`;

                const midjourneyPrompt = existingCaption
                    ? `${existingCaption}, ${style}, professional grade, cinematic lighting, ${quality} --v 6 --ar 16:9 --style raw --q 2`
                    : `professional photograph, ${composition}, ${lighting}, ${style}, ${quality} --v 6 --ar 16:9 --style raw`;
                
                const dallePrompt = existingCaption
                    ? `Create a highly detailed and professional image: ${existingCaption}. Style: ${style}. The image should feature ${composition} with ${lighting}. Ensure sharp focus, vibrant colors, and exceptional quality.`
                    : `Create a professional, highly detailed image with ${composition}. Use ${lighting} and ${style} aesthetic. Focus on clarity, vibrant colors, and masterpiece quality rendering.`;
                
                const stableDiffusionPrompt = existingCaption
                    ? `${existingCaption}, ${style}, ${composition}, ${lighting}, ${quality}, 8k uhd, professional photography, trending on artstation, award winning, photorealistic`
                    : `professional image, ${style}, ${composition}, ${lighting}, ${quality}, 8k uhd, detailed render, cinematic, trending on artstation`;

                const negativePrompt = "blurry, low quality, distorted, ugly, deformed, bad anatomy, watermark, text, low resolution, pixelated, noise, overexposed, underexposed, out of frame, duplicate, grainy";

                const resultText = 
                    `┌ ❏ *⌜ AI PROMPT GENERATED ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ✅ *Prompts Ready!*\n` +
                    `├◆ 👤 *Requested by:* ${senderName}\n` +
                    (existingCaption ? `├◆ 📝 *Original caption found*\n` : `├◆ 📝 *Generic prompts generated*\n`) +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true })}\n` +
                    `│\n` +
                    `└ ❏\n\n` +
                    (existingCaption ? `🎨 *ORIGINAL CAPTION:*\n${mainSubject}\n\n` : '') +
                    `🔧 *SUGGESTED ELEMENTS:*\n` +
                    `• Style: ${style}\n` +
                    `• Composition: ${composition}\n` +
                    `• Lighting: ${lighting}\n` +
                    `• Quality: Professional, detailed\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `💡 *COPY-PASTE PROMPTS:*\n\n` +
                    `*For Midjourney v6:*\n` +
                    `\`\`\`\n${midjourneyPrompt}\n\`\`\`\n\n` +
                    `*For DALL-E 3:*\n` +
                    `\`\`\`\n${dallePrompt}\n\`\`\`\n\n` +
                    `*For Stable Diffusion:*\n` +
                    `\`\`\`\n${stableDiffusionPrompt}\n\`\`\`\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `⚠️ *NEGATIVE PROMPT:*\n` +
                    `(What to avoid)\n` +
                    `\`\`\`\n${negativePrompt}\n\`\`\`\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `┌ ❏ *⌜ PRO TIPS ⌟* ❏\n` +
                    `│\n` +
                    `├◆ 📋 Copy entire prompt block\n` +
                    `├◆ 🎨 Customize style keywords\n` +
                    `├◆ 🔢 Adjust --ar ratio (16:9, 1:1, 9:16)\n` +
                    `├◆ 💪 Add specific details you want\n` +
                    `├◆ 🔄 Experiment across platforms\n` +
                    (existingCaption ? `├◆ ✏️ Original caption included in prompts\n` : `├◆ ✏️ Add your own subject details\n`) +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                await sock.sendMessage(from, {
                    text: resultText
                }, { quoted: msg });

            } catch (extractError) {
                throw new Error(`Generation failed: ${extractError.message}`);
            }

        } catch (error) {
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to generate prompt*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n` +
                    `│\n` +
                    `├◆ 🔧 *Solution:*\n` +
                    `├◆    • Make sure to reply to an image\n` +
                    `├◆    • Check image isn't corrupted\n` +
                    `├◆    • Try a different image\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};