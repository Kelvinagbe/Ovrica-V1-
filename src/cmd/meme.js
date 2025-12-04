const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'meme',
    admin: false,
    description: 'Get random memes or create custom memes',

    exec: async (sock, from, args, msg) => {
        try {
            // Get random meme
            if (args[0] === 'random' || args.length === 0) {
                await sock.sendMessage(from, {
                    text: `😂 *Getting random meme...*\n\n⏳ Please wait...`
                }, { quoted: msg });

                const meme = await getRandomMeme();

                return await sock.sendMessage(from, {
                    image: { url: meme.url },
                    caption: `😂 *${meme.title}*\n\n👍 ${meme.ups} upvotes\n🔗 r/${meme.subreddit}\n\n> Use /meme templates to create custom memes`
                });
            }

            // List meme templates
            if (args[0] === 'templates') {
                const templates = await getMemeTemplates();
                
                let response = `┌ ❏ *⌜ MEME TEMPLATES ⌟* ❏\n│\n`;
                response += `├◆ 😂 *Popular templates*\n│\n`;
                response += `└ ❏\n`;
                response += `┌ ❏ ◆ *⌜TOP 10⌟* ◆\n│\n`;
                
                templates.slice(0, 10).forEach((t, i) => {
                    response += `├◆ ${i + 1}. ${t.name} (ID: ${t.id})\n`;
                });
                
                response += `│\n└ ❏\n`;
                response += `┌ ❏ ◆ *⌜USAGE⌟* ◆\n│\n`;
                response += `├◆ /meme create [ID] [top];[bottom]\n`;
                response += `├◆ Example: /meme create 181913649 When you;Find a bug\n│\n`;
                response += `└ ❏`;

                return await sock.sendMessage(from, { text: response }, { quoted: msg });
            }

            // Create custom meme
            if (args[0] === 'create' && args.length > 2) {
                const templateId = args[1];
                const texts = args.slice(2).join(' ').split(';');
                const topText = texts[0] || '';
                const bottomText = texts[1] || '';

                await sock.sendMessage(from, {
                    text: `🎨 *Creating meme...*\n\n⏳ Please wait...`
                }, { quoted: msg });

                const memeUrl = await createMeme(templateId, topText, bottomText);

                return await sock.sendMessage(from, {
                    image: { url: memeUrl },
                    caption: `✅ *Meme Created!*\n\n📝 Top: ${topText}\n📝 Bottom: ${bottomText}`
                });
            }

            // Help message
            return await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ MEME GENERATOR ⌟* ❏\n│\n` +
                    `├◆ 😂 *Get & create memes*\n│\n` +
                    `└ ❏\n` +
                    `┌ ❏ ◆ *⌜COMMANDS⌟* ◆\n│\n` +
                    `├◆ /meme random - Random Reddit meme\n` +
                    `├◆ /meme templates - List templates\n` +
                    `├◆ /meme create [ID] [top];[bottom]\n│\n` +
                    `└ ❏\n> Powered by 😂Imgflip😂`
            }, { quoted: msg });

        } catch (error) {
            console.error('Meme error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Failed!*\n\n📝 ${error.message}`
            }, { quoted: msg });
        }
    }
};

// Get random meme from Reddit (FREE)
async function getRandomMeme() {
    const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'me_irl'];
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
    
    const response = await axios.get(`https://meme-api.com/gimme/${subreddit}`);
    
    return {
        title: response.data.title,
        url: response.data.url,
        ups: response.data.ups,
        subreddit: response.data.subreddit
    };
}

// Get meme templates from Imgflip (FREE)
async function getMemeTemplates() {
    const response = await axios.get('https://api.imgflip.com/get_memes');
    return response.data.data.memes;
}

// Create meme using Imgflip (FREE)
async function createMeme(templateId, topText, bottomText) {
    const response = await axios.post('https://api.imgflip.com/caption_image', null, {
        params: {
            template_id: templateId,
            username: 'imgflip_hubot',
            password: 'imgflip_hubot',
            text0: topText,
            text1: bottomText
        }
    });

    if (response.data.success) {
        return response.data.data.url;
    }
    
    throw new Error('Failed to create meme');
}