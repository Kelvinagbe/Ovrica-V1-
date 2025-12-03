const axios = require('axios');

module.exports = {
    name: 'enhance',
    admin: false,
    description: 'Enhance/upscale images',

    exec: async (sock, from, args, msg) => {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const hasImage = quotedMsg?.imageMessage;

        if (!hasImage) {
            return await sock.sendMessage(from, {
                text: `📝 Reply to an image with /enhance`
            }, { quoted: msg });
        }

        await sock.sendMessage(from, {
            text: `🔧 Enhancing image...\n\n⏳ Please wait...`
        }, { quoted: msg });

        try {
            // Download image
            const stream = await downloadMediaMessage(
                quotedMsg,
                'buffer',
                {},
                { reuploadRequest: sock.updateMediaMessage }
            );

            // Upload to image host
            const form = new FormData();
            form.append('image', stream, 'image.jpg');
            
            const uploadResponse = await axios.post('https://api.imgbb.com/1/upload?key=YOUR_KEY', form);
            const imageUrl = uploadResponse.data.data.url;

            // Enhance APIs
            const apis = [
                `https://api.betabotz.eu.org/api/tools/remini?url=${encodeURIComponent(imageUrl)}`,
                `https://api.popcat.xyz/enhance?image=${encodeURIComponent(imageUrl)}`,
                `https://widipe.com/remini?url=${encodeURIComponent(imageUrl)}`
            ];

            let enhancedUrl = null;
            for (const api of apis) {
                try {
                    const response = await axios.get(api, { timeout: 90000 });
                    enhancedUrl = response.data?.url || response.data?.image || response.data?.result;
                    if (enhancedUrl) break;
                } catch (err) {
                    console.log('API failed, trying next...');
                }
            }

            if (!enhancedUrl) throw new Error('Enhancement failed');

            const enhancedBuffer = await axios.get(enhancedUrl, { responseType: 'arraybuffer' });

            await sock.sendMessage(from, {
                image: Buffer.from(enhancedBuffer.data),
                caption: `✅ Image Enhanced!\n\n> 🔧 AI Enhancer`
            }, { quoted: msg });

        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};