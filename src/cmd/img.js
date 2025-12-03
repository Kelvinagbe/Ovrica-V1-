// commands/imagine.js - AI Image Analysis with Custom Instructions (Gemini Free API)

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Get free Gemini API key from: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = 'AIzaSyB296-KcFD1n_m2HhoUkPsRzhyMCX-CbzU'; // Replace with your free key

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
                        `├◆ 3. AI analyzes & suggests!\n` +
                        `│\n` +
                        `├◆ 💡 *Examples:*\n` +
                        `├◆ /imagine what is this?\n` +
                        `├◆ /imagine make it cyberpunk\n` +
                        `├◆ /imagine change to night scene\n` +
                        `├◆ /imagine add more details\n` +
                        `├◆ /imagine anime style version\n` +
                        `├◆ /imagine remove background\n` +
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
                        `💡 Then tell me what you want:\n` +
                        `• Describe the image\n` +
                        `• Suggest modifications\n` +
                        `• Change style/mood\n` +
                        `• Add/remove elements`
                }, { quoted: msg });
            }

            // Check if API key is configured
            if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
                return await sock.sendMessage(from, {
                    text: `❌ *API Key Not Configured*\n\n` +
                        `To use this command:\n\n` +
                        `1. Get FREE Gemini API key from:\n` +
                        `   https://makersuite.google.com/app/apikey\n\n` +
                        `2. Add it to commands/imagine.js:\n` +
                        `   Replace "YOUR_GEMINI_API_KEY_HERE"\n\n` +
                        `3. Restart the bot\n\n` +
                        `✅ Free tier: 60 requests/minute\n` +
                        `✅ No credit card required`
                }, { quoted: msg });
            }

            const userRequest = args.join(' ') || 'describe this image and tell me how to recreate it with AI';
            const contextInfo = msg.message.extendedTextMessage.contextInfo;
            const sender = contextInfo.participant || from;
            const senderName = msg.pushName || 'Unknown';

            await sock.sendMessage(from, {
                text: `⏳ *AI is analyzing...*\n\n` +
                    `🔍 Your request: "${userRequest}"\n` +
                    `🤖 Processing with Gemini AI...\n` +
                    `⏱️ Please wait 10-20 seconds...`
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
                const imageMsg = quotedMsg.imageMessage;
                const mimetype = imageMsg.mimetype || 'image/jpeg';

                // Call Google Gemini API (FREE - 60 requests/min)
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    {
                                        inline_data: {
                                            mime_type: mimetype,
                                            data: base64Image
                                        }
                                    },
                                    {
                                        text: `User's request: "${userRequest}"

Analyze this image and create AI generation prompts. Respond with ONLY the prompts in this exact format:

MIDJOURNEY:
[detailed prompt] --v 6 --ar 16:9

DALL-E:
[detailed prompt]

STABLE DIFFUSION:
[detailed prompt with quality tags]

${userRequest.toLowerCase().includes('change') || userRequest.toLowerCase().includes('make') || userRequest.toLowerCase().includes('modify') || userRequest.toLowerCase().includes('add') || userRequest.toLowerCase().includes('remove') ? 
`
MODIFIED VERSION (${userRequest}):
[new prompt incorporating the requested changes]` : ''}

Be concise and specific. Focus on visual details only.`
                                    }
                                ]
                            }]
                        })
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'API request failed');
                }

                const data = await response.json();

                if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                    throw new Error('Invalid API response - no content generated');
                }

                const aiResponse = data.candidates[0].content.parts[0].text;

                const resultText = 
                    `┌ ❏ *⌜ AI ANALYSIS COMPLETE ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ✅ *Analysis Ready!*\n` +
                    `├◆ 👤 *Requested by:* ${senderName}\n` +
                    `├◆ 📝 *Request:* ${userRequest}\n` +
                    `├◆ 🤖 *AI:* Google Gemini 1.5 Flash\n` +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true })}\n` +
                    `│\n` +
                    `└ ❏\n\n` +
                    `${aiResponse}\n\n` +
                    `┌ ❏ *⌜ USAGE TIPS ⌟* ❏\n` +
                    `│\n` +
                    `├◆ 📋 Copy prompts to AI generators\n` +
                    `├◆ 🎨 Adjust details as needed\n` +
                    `├◆ 🔄 Try different variations\n` +
                    `├◆ 💬 Ask follow-up questions\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                await sock.sendMessage(from, {
                    text: resultText
                }, { quoted: msg });

            } catch (apiError) {
                throw new Error(`AI analysis failed: ${apiError.message}`);
            }

        } catch (error) {
            let errorMsg = error.message;
            let errorSolution = 'Try again';

            if (error.message.includes('API key')) {
                errorMsg = 'Invalid or expired API key';
                errorSolution = 'Get a new free key from https://makersuite.google.com/app/apikey';
            } else if (error.message.includes('quota')) {
                errorMsg = 'API quota exceeded';
                errorSolution = 'Wait a minute or get another free API key';
            } else if (error.message.includes('download')) {
                errorMsg = 'Could not download image';
                errorSolution = 'Image may be too large (max 4MB for Gemini)';
            } else if (error.message.includes('SAFETY')) {
                errorMsg = 'Content filtered by AI safety';
                errorSolution = 'Image may contain sensitive content';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to analyze image*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `├◆ 💡 *Solution:* ${errorSolution}\n` +
                    `│\n` +
                    `├◆ 🔧 *Possible reasons:*\n` +
                    `├◆    • Invalid/expired API key\n` +
                    `├◆    • Rate limit exceeded\n` +
                    `├◆    • Image too large (>4MB)\n` +
                    `├◆    • Network error\n` +
                    `├◆    • Content filtered by AI\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};