// commands/menu.js - Main menu with fancy reply using local image

const { templates } = require('../templates');
const fs = require('fs');

function getBotInfo(config) {
    return {
        name: 'OVRICA-V1',
        owner: 'KELVIN AGBE',
        prefix: '/',
        user: 'User',
        plan: 'Free User',
        version: '1.0.0',
        timezone: 'Africa/Lagos',
        commandCount: '2550',
        platform: 'LINUX',
        runtime: process.version,
        cpu: 'Intel(R) Xeon(R) CPU E5-1620 v2 @ 3.70GHz',
        totalRam: '32050MB',
        mode: config.botMode || 'Public',
        mood: '🌙'
    };
}

module.exports = {
    name: 'menu',
    admin: false,
    description: 'Show main menu',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            // Helper function for fancy reply
            const sendFancyReply = async (text, imagePath = null, quoted = msg) => {
                const contextInfo = {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "🎭 OVRICA-V1🎭",
                        body: "OVRICA WhatsApp Bot v1.0",
                        thumbnailUrl: "https://files.catbox.moe/ked25s.jpg",
                        sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                };

                // If image path provided, send as image with caption
                if (imagePath) {
                    // Check if file exists before reading
                    if (fs.existsSync(imagePath)) {
                        return await sock.sendMessage(from, {
                            image: fs.readFileSync(imagePath),
                            caption: text,
                            contextInfo: contextInfo
                        }, { quoted: quoted });
                    } else {
                        console.warn(`⚠️ Image not found at ${imagePath}, sending text only`);
                    }
                }

                // Send as text with fancy reply (fallback or default)
                return await sock.sendMessage(from, {
                    text: text,
                    contextInfo: contextInfo
                }, { quoted: quoted });
            };

            const CONFIG = require('../config');
            const text = templates.menu(getBotInfo(CONFIG));

            // Send with local image from path
            // Change './assets/.jpg' to your actual image path
            await sendFancyReply(text, './assets/app.png');

            console.log(`📱 Menu sent to ${from}`);

        } catch (error) {
            console.error('❌ Menu command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to load menu. Please try again!');
        }
    }
};