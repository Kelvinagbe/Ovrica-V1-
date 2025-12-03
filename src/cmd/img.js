// commands/imagine.js - AI Image Analysis (100% Free - No API Key!)

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'imagine',
    admin: false,
    description: 'Ask AI to analyze image and suggest how to regenerate it',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ AI IMAGE ANALYZER ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 🤖 *How to use:*\n` +
                        `├◆ 1. Reply to any image\n` +
                        `├◆ 2. Type: /imagine [your request]\n` +
                        `├◆ 3. AI analyzes & creates prompts!\n` +
                        `│\n` +
                        `├◆ 💡 *Examples:*\n` +
                        `├◆ /imagine\n` +
                        `├◆ /imagine make it cyberpunk\n` +
                        `├◆ /imagine anime style\n` +
                        `├◆ /imagine add neon lights\n` +
                        `├◆ /imagine dark fantasy theme\n` +
                        `│\n` +
                        `├◆ ✅ 100% FREE - No API key needed!\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            const isImage = !!quotedMsg.imageMessage;

            if (!isImage) {
                return await sock.sendMessage(from, {
                    text: `❌ *Not an image!*\n\n` +
                        `Please reply to an image message.`
                }, { quoted: msg });
            }

            const userRequest = args.join(' ') || '';
            const contextInfo = msg.message.extendedTextMessage.contextInfo;
            const sender = contextInfo.participant || from;
            const senderName = msg.pushName || 'Unknown';

            await sock.sendMessage(from, {
                text: `⏳ *AI is analyzing your image...*\n\n` +
                    (userRequest ? `🔍 Request: "${userRequest}"\n` : `🔍 Analyzing image...\n`) +
                    `🤖 Using BLIP AI Model\n` +
                    `⏱️ Please wait 5-10 seconds...`
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

                // Call FREE Hugging Face BLIP API (send image directly as binary)
                const response = await fetch(
                    "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/octet-stream",
                        },
                        body: buffer
                    }
                );

                if (!response.ok) {
                    throw new Error('AI analysis failed');
                }

                const data = await response.json();
                const baseDescription = data[0]?.generated_text || "an image";

                // Build AI prompts based on analysis
                let modifiedDescription = baseDescription;
                
                if (userRequest) {
                    const requestLower = userRequest.toLowerCase();
                    
                    if (requestLower.includes('cyberpunk')) {
                        modifiedDescription = `${baseDescription}, neon lights, futuristic cityscape, cyberpunk aesthetic, synthwave colors, tech noir atmosphere`;
                    } else if (requestLower.includes('anime')) {
                        modifiedDescription = `${baseDescription}, anime style, manga art, cel-shaded, vibrant colors, Japanese animation aesthetic`;
                    } else if (requestLower.includes('dark') || requestLower.includes('fantasy')) {
                        modifiedDescription = `${baseDescription}, dark fantasy theme, dramatic lighting, mystical atmosphere, epic composition`;
                    } else if (requestLower.includes('vintage') || requestLower.includes('retro')) {
                        modifiedDescription = `${baseDescription}, vintage aesthetic, retro style, film grain, nostalgic mood`;
                    } else if (requestLower.includes('neon') || requestLower.includes('glow')) {
                        modifiedDescription = `${baseDescription}, glowing neon lights, vibrant illumination, electric atmosphere`;
                    } else if (requestLower.includes('realistic') || requestLower.includes('photo')) {
                        modifiedDescription = `${baseDescription}, photorealistic, professional photography, high detail, DSLR quality`;
                    } else {
                        modifiedDescription = `${baseDescription}, ${userRequest}`;
                    }
                }

                const qualityTags = "highly detailed, professional quality, 4k, sharp focus, masterpiece";

                const midjourneyPrompt = `${modifiedDescription}, ${qualityTags} --v 6 --ar 16:9 --q 2`;
                const dallePrompt = `Create a highly detailed image: ${modifiedDescription}. Professional quality with exceptional detail and clarity.`;
                const stableDiffusionPrompt = `${modifiedDescription}, ${qualityTags}, 8k uhd, trending on artstation`;

                const resultText = 
                    `┌ ❏ *⌜ AI PROMPTS GENERATED ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ✅ *Analysis Complete!*\n` +
                    `├◆ 👤 *By:* ${senderName}\n` +
                    (userRequest ? `├◆ 📝 *Modified:* ${userRequest}\n` : '') +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true })}\n` +
                    `│\n` +
                    `└ ❏\n\n` +
                    `🎨 *AI DESCRIPTION:*\n` +
                    `${baseDescription}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `*MIDJOURNEY:*\n` +
                    `\`\`\`\n${midjourneyPrompt}\n\`\`\`\n\n` +
                    `*DALL-E:*\n` +
                    `\`\`\`\n${dallePrompt}\n\`\`\`\n\n` +
                    `*STABLE DIFFUSION:*\n` +
                    `\`\`\`\n${stableDiffusionPrompt}\n\`\`\`\n\n` +
                    (userRequest ? `━━━━━━━━━━━━━━━━━━━━━\n\n🔄 *YOUR MODIFICATION:*\n${modifiedDescription}\n\n` : '') +
                    `┌ ❏ *⌜ TIPS ⌟* ❏\n` +
                    `│\n` +
                    `├◆ 📋 Copy prompts to AI tools\n` +
                    `├◆ 🎨 Adjust details as needed\n` +
                    `├◆ 🔄 Try variations\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                await sock.sendMessage(from, {
                    text: resultText
                }, { quoted: msg });

            } catch (apiError) {
                throw new Error(`Analysis failed: ${apiError.message}`);
            }

        } catch (error) {
            let errorMsg = error.message;
            let errorSolution = 'Try again in a moment';

            if (error.message.includes('upload')) {
                errorMsg = 'Image upload failed';
                errorSolution = 'Image may be too large (max 5MB)';
            } else if (error.message.includes('analysis failed')) {
                errorMsg = 'AI model is busy';
                errorSolution = 'Wait 10-20 seconds and try again';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to analyze*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};