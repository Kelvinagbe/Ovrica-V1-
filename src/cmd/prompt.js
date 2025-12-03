// commands/prompt.js - Generate AI prompt from image using Hugging Face

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

            await sock.sendMessage(from, {
                text: `⏳ *Analyzing image...*\n\n` +
                    `🔍 AI is detecting:\n` +
                    `• Main subjects & objects\n` +
                    `• Art style & aesthetics\n` +
                    `• Colors & composition\n` +
                    `• Details & mood\n\n` +
                    `⏱️ This takes 5-15 seconds...`
            }, { quoted: msg });

            try {
                const messageForDownload = {
                    key: {
                        remoteJid: from,
                        id: contextInfo.stanzaId,
                        participant: sender
                    },
                    message: quotedMsg
                };

                const buffer = await downloadMediaMessage(
                    messageForDownload,
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );

                const base64Image = buffer.toString('base64');

                // Use Hugging Face BLIP model for image captioning
                const captionResponse = await fetch(
                    "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            inputs: base64Image,
                            options: {
                                wait_for_model: true
                            }
                        })
                    }
                );

                if (!captionResponse.ok) {
                    const errorText = await captionResponse.text();
                    if (errorText.includes('loading')) {
                        throw new Error('MODEL_LOADING');
                    }
                    throw new Error('Image analysis failed');
                }

                const captionData = await captionResponse.json();
                const baseDescription = captionData[0]?.generated_text || "an image";

                // Try to get additional tags from image classification
                const classifyResponse = await fetch(
                    "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            inputs: base64Image,
                            options: {
                                wait_for_model: true
                            }
                        })
                    }
                );

                let tags = [];
                let confidence = 'medium';
                
                if (classifyResponse.ok) {
                    const classifyData = await classifyResponse.json();
                    if (Array.isArray(classifyData)) {
                        tags = classifyData.slice(0, 5).map(item => item.label);
                        confidence = classifyData[0]?.score > 0.7 ? 'high' : 'medium';
                    }
                }

                // Enhance the prompt
                const artStyle = this.detectArtStyle(baseDescription, tags);
                const colorPalette = this.detectColors(baseDescription, tags);
                const composition = this.detectComposition(baseDescription);
                const qualityTags = "highly detailed, professional quality, 4k resolution, sharp focus, masterpiece";

                // Build comprehensive prompts
                const mainPrompt = `${baseDescription}, ${tags.slice(0, 3).join(', ')}`;
                
                const midjourneyPrompt = `${mainPrompt}, ${artStyle}, ${colorPalette}, ${composition}, ${qualityTags} --v 6 --ar 16:9 --style raw`;
                
                const dallePrompt = `Create a highly detailed and professional image: ${baseDescription}. The image should feature ${tags.slice(0, 3).join(', ')} with a ${artStyle} aesthetic. Use ${colorPalette} color scheme with ${composition} composition. Ensure sharp focus, vibrant colors, and masterpiece quality.`;
                
                const stableDiffusionPrompt = `${mainPrompt}, ${artStyle}, ${colorPalette}, ${composition}, ${qualityTags}, 8k uhd, studio lighting, professional photography, trending on artstation, award winning`;

                const negativePrompt = "blurry, low quality, distorted, ugly, deformed, mutated, disfigured, bad anatomy, bad proportions, watermark, signature, text, low resolution, pixelated, noise, grain, overexposed, underexposed, out of frame";

                const resultText = 
                    `┌ ❏ *⌜ AI PROMPT GENERATED ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ✅ *Analysis Complete!*\n` +
                    `├◆ 👤 *Requested by:* ${senderName}\n` +
                    `├◆ 🎯 *Confidence:* ${confidence === 'high' ? '95%' : '85%'}\n` +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true })}\n` +
                    `│\n` +
                    `└ ❏\n\n` +
                    `🎨 *MAIN DESCRIPTION:*\n` +
                    `${baseDescription}\n\n` +
                    `🔧 *DETECTED ELEMENTS:*\n` +
                    `• Objects: ${tags.join(', ') || 'general scene'}\n` +
                    `• Style: ${artStyle}\n` +
                    `• Colors: ${colorPalette}\n` +
                    `• Composition: ${composition}\n\n` +
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
                    `├◆ 🎨 Adjust style keywords as needed\n` +
                    `├◆ 🔢 Change aspect ratio (--ar)\n` +
                    `├◆ 💪 Add weight to important words\n` +
                    `├◆ 🔄 Try different AI generators\n` +
                    `├◆ ⚡ Experiment with variations\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                await sock.sendMessage(from, {
                    text: resultText
                }, { quoted: msg });

            } catch (extractError) {
                if (extractError.message === 'MODEL_LOADING') {
                    throw new Error('AI model is loading. Please wait 20 seconds and try again.');
                }
                throw new Error(`Analysis failed: ${extractError.message}`);
            }

        } catch (error) {
            let errorMsg = error.message;
            let errorSolution = 'Try again in a few moments';

            if (error.message.includes('MODEL_LOADING') || error.message.includes('loading')) {
                errorMsg = 'AI model is warming up';
                errorSolution = 'Wait 20-30 seconds and try again';
            } else if (error.message.includes('Image analysis failed')) {
                errorMsg = 'AI service temporarily busy';
                errorSolution = 'Wait 10-20 seconds and try again';
            } else if (error.message.includes('download')) {
                errorMsg = 'Could not download image';
                errorSolution = 'Image may be too large (max 5MB)';
            } else if (error.message.includes('rate')) {
                errorMsg = 'Too many requests';
                errorSolution = 'Wait 1 minute and try again';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to generate prompt*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `├◆ 🔧 *Possible reasons:*\n` +
                    `├◆    • Model loading (first use)\n` +
                    `├◆    • Rate limit reached\n` +
                    `├◆    • Image too large (>5MB)\n` +
                    `├◆    • Network error\n` +
                    `├◆    • Invalid image format\n` +
                    `│\n` +
                    `├◆ 💡 *Tips:*\n` +
                    `├◆    • Wait and retry\n` +
                    `├◆    • Use smaller images\n` +
                    `├◆    • Try during off-peak hours\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    },

    detectArtStyle(description, tags) {
        const desc = description.toLowerCase();
        const allTags = tags.join(' ').toLowerCase();
        
        if (desc.includes('painting') || allTags.includes('painting')) {
            return 'oil painting style, artistic canvas texture, traditional art';
        } else if (desc.includes('cartoon') || allTags.includes('cartoon') || allTags.includes('animated')) {
            return 'cartoon style, animated, cel-shaded, vibrant colors';
        } else if (desc.includes('drawing') || allTags.includes('sketch') || allTags.includes('pencil')) {
            return 'hand-drawn, sketch style, pencil art, artistic linework';
        } else if (desc.includes('anime') || allTags.includes('anime') || allTags.includes('manga')) {
            return 'anime style, manga art, japanese animation';
        } else if (desc.includes('photo') || allTags.includes('photograph')) {
            return 'photorealistic, professional photography, cinematic';
        } else if (allTags.includes('digital') || allTags.includes('render') || allTags.includes('cgi')) {
            return 'digital art, 3d render, CGI, octane render';
        } else if (desc.includes('abstract') || allTags.includes('abstract')) {
            return 'abstract art, modern art, contemporary';
        } else {
            return 'professional style, high quality render';
        }
    },

    detectColors(description, tags) {
        const desc = description.toLowerCase();
        const allTags = tags.join(' ').toLowerCase();
        
        const colorKeywords = {
            'warm': ['warm', 'orange', 'red', 'yellow', 'sunset', 'golden'],
            'cool': ['cool', 'blue', 'cyan', 'teal', 'ice', 'winter'],
            'vibrant': ['vibrant', 'colorful', 'bright', 'vivid', 'saturated'],
            'muted': ['muted', 'pastel', 'soft', 'subtle', 'pale'],
            'dark': ['dark', 'black', 'night', 'shadow', 'noir'],
            'light': ['light', 'white', 'bright', 'airy', 'luminous']
        };

        for (const [palette, keywords] of Object.entries(colorKeywords)) {
            if (keywords.some(kw => desc.includes(kw) || allTags.includes(kw))) {
                return `${palette} color palette`;
            }
        }

        return 'natural color palette, balanced tones';
    },

    detectComposition(description) {
        const desc = description.toLowerCase();
        
        if (desc.includes('close') || desc.includes('closeup') || desc.includes('macro')) {
            return 'close-up shot, detailed macro photography';
        } else if (desc.includes('portrait')) {
            return 'portrait composition, centered subject';
        } else if (desc.includes('landscape') || desc.includes('wide')) {
            return 'wide angle, landscape composition';
        } else if (desc.includes('side') || desc.includes('profile')) {
            return 'side view, profile angle';
        } else if (desc.includes('top') || desc.includes('above') || desc.includes('aerial')) {
            return 'top-down view, aerial perspective';
        } else if (desc.includes('dramatic') || desc.includes('dynamic')) {
            return 'dynamic composition, dramatic angle';
        } else {
            return 'balanced composition, rule of thirds';
        }
    }
};