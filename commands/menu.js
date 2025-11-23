// commands/menu.js - Main menu with fancy reply

const { templates } = require('../templates');

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

            const sendFancyReply = async (text, imageUrl = null, quoted = msg) => {

                const messageContent = {

                    text: text,

                    contextInfo: {

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

                            thumbnailUrl: "https://files.catbox.moe/gzrvvk.jpg",

                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",

                            mediaType: 1,

                            renderLargerThumbnail: true

                        }

                    }

                };

                

                // If image URL provided, send as image with caption

                if (imageUrl) {

                    return await sock.sendMessage(from, {

                        image: { url: imageUrl },

                        caption: text,

                        contextInfo: messageContent.contextInfo

                    }, { quoted: quoted });

                }

                

                // Otherwise send as text with fancy reply

                return await sock.sendMessage(from, messageContent, { quoted: quoted });

            };

            

            const CONFIG = require('../config');

            const text = templates.menu(getBotInfo(CONFIG));

            

            // Option 1: Send with image (uncomment and set your image path)

            // await sendFancyReply(text, 'https://your-image-url.com/menu.jpg');

            

            // Option 2: Send with local image

       //      await sendFancyReply(text, './assets/menu.jpg');

            

            // Option 3: Send text only with fancy reply (default)

            await sendFancyReply(text);

            

            console.log(`📱 Menu sent to ${from}`);

            

        } catch (error) {

            console.error('❌ Menu command error:', error);

            await sendWithTyping(sock, from, '❌ Failed to load menu. Please try again!');

        }

    }

};