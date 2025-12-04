const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const crypto = require('crypto');

module.exports = {
    name: 'avatar',
    admin: false,
    description: 'Generate random avatars',

    exec: async (sock, from, args, msg) => {
        try {
            const style = args[0] || 'random';
            
            await sock.sendMessage(from, {
                text: `👤 *Generating avatar...*\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Generate unique avatar using Multiavatar (FREE)
            const avatarId = crypto.randomBytes(16).toString('hex');
            const avatarUrl = `https://api.multiavatar.com/${avatarId}.png`;

            // Alternative: DiceBear (FREE)
            const styles = ['avataaars', 'bottts', 'pixel-art', 'identicon', 'gridy'];
            const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
            const dicebearUrl = `https://api.dicebear.com/7.x/${selectedStyle}/png?seed=${avatarId}`;

            // Download avatar
            const response = await axios.get(dicebearUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(from, {
                image: buffer,
                caption: `✅ *Avatar Generated!*\n\n🎨 Style: ${selectedStyle}\n👤 Unique ID: ${avatarId.substring(0, 8)}\n\n> Generate again for new avatar!`
            });

        } catch (error) {
            console.error('Avatar error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Failed!*\n\n📝 ${error.message}`
            }, { quoted: msg });
        }
    }
};