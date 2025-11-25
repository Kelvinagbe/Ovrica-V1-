// commands/news.js - Latest News Headlines
// Install: npm install axios

const axios = require('axios');

// Free news API - NewsAPI.org (Get free key at https://newsapi.org/)
// Or use alternative: https://newsdata.io/

module.exports = {
    name: 'news',
    alias: ['berita', 'headlines'],
    admin: false,
    description: 'Get latest news headlines',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            console.log('📰 News command executed');

            const category = args[0]?.toLowerCase() || 'general';

            const categories = {
                'general': '🌍 General',
                'business': '💼 Business',
                'tech': '💻 Technology',
                'technology': '💻 Technology',
                'sports': '⚽ Sports',
                'entertainment': '🎬 Entertainment',
                'health': '🏥 Health',
                'science': '🔬 Science'
            };

            // Show help
            if (args[0] === 'help' || args[0] === 'categories') {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ NEWS ⌟* ❏\n│\n` +
                        `├◆ 📰 *Latest Headlines*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜CATEGORIES⌟* ◆\n│\n` +
                        `├◆ /news - General news\n` +
                        `├◆ /news business - Business news\n` +
                        `├◆ /news tech - Technology news\n` +
                        `├◆ /news sports - Sports news\n` +
                        `├◆ /news entertainment - Entertainment\n` +
                        `├◆ /news health - Health news\n` +
                        `├◆ /news science - Science news\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            const processingMsg = await sock.sendMessage(from, {
                text: `📰 *Fetching ${categories[category] || '🌍 General'} news...*\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Use NewsAPI (replace with your API key)
            const API_KEY = process.env.NEWS_API_KEY || 'YOUR_API_KEY_HERE';
            
            // If no API key, use alternative free RSS feed
            let articles;
            
            if (API_KEY === 'YOUR_API_KEY_HERE') {
                // Use free RSS feed alternative
                articles = await getNewsFromRSS(category);
            } else {
                // Use NewsAPI
                const normalizedCategory = category === 'tech' ? 'technology' : category;
                const url = `https://newsapi.org/v2/top-headlines?category=${normalizedCategory}&language=en&pageSize=5&apiKey=${API_KEY}`;
                
                const response = await axios.get(url);
                articles = response.data.articles;
            }

            if (!articles || articles.length === 0) {
                return await sock.sendMessage(from, {
                    text: `❌ *No news found!*\n\n` +
                        `📝 Try different category or try again later`,
                    edit: processingMsg.key
                });
            }

            // Format news
            let newsText = `┌ ❏ *⌜ ${categories[category] || '🌍 GENERAL'} NEWS ⌟* ❏\n│\n`;
            newsText += `├◆ 📰 *Latest Headlines*\n│\n`;
            newsText += `└ ❏\n\n`;

            articles.slice(0, 5).forEach((article, index) => {
                newsText += `┌ ❏ *${index + 1}. ${article.title}*\n│\n`;
                if (article.description) {
                    newsText += `├◆ 📝 ${article.description.substring(0, 150)}${article.description.length > 150 ? '...' : ''}\n│\n`;
                }
                newsText += `├◆ 📅 ${formatDate(article.publishedAt)}\n`;
                newsText += `├◆ 🔗 ${article.url}\n│\n`;
                newsText += `└ ❏\n\n`;
            });

            newsText += `> Powered by 🎭Kelvin🎭`;

            // Send with image if available
            if (articles[0].urlToImage) {
                try {
                    const imageResponse = await axios.get(articles[0].urlToImage, { responseType: 'arraybuffer' });
                    await sock.sendMessage(from, {
                        image: Buffer.from(imageResponse.data),
                        caption: newsText
                    }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, {
                        text: newsText,
                        edit: processingMsg.key
                    });
                }
            } else {
                await sock.sendMessage(from, {
                    text: newsText,
                    edit: processingMsg.key
                });
            }

            // Delete processing message if image was sent
            if (articles[0].urlToImage) {
                await sock.sendMessage(from, { delete: processingMsg.key }).catch(() => {});
            }

            console.log(`✅ Sent ${articles.length} news articles`);

        } catch (error) {
            console.error('❌ News error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n│\n` +
                    `├◆ ❌ *Failed to fetch news*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n│\n` +
                    `├◆ 💡 Set NEWS_API_KEY in .env\n` +
                    `├◆ 🔑 Get free key: https://newsapi.org/\n│\n` +
                    `└ ❏\n> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};

// Alternative free RSS feed parser (no API key needed)
async function getNewsFromRSS(category) {
    try {
        // Use Google News RSS
        const categoryMap = {
            'general': 'world',
            'business': 'business',
            'tech': 'technology',
            'technology': 'technology',
            'sports': 'sports',
            'entertainment': 'entertainment',
            'health': 'health',
            'science': 'science'
        };

        const rssCat = categoryMap[category] || 'world';
        const url = `https://news.google.com/rss/headlines/section/topic/${rssCat.toUpperCase()}?hl=en&gl=US&ceid=US:en`;

        const response = await axios.get(url);
        const xml = response.data;

        // Parse RSS XML
        const articles = [];
        const itemRegex = /<item>(.*?)<\/item>/gs;
        const matches = [...xml.matchAll(itemRegex)];

        matches.slice(0, 5).forEach(match => {
            const item = match[1];
            
            const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
            const linkMatch = item.match(/<link>(.*?)<\/link>/);
            const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
            const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);

            if (titleMatch && linkMatch) {
                articles.push({
                    title: titleMatch[1],
                    url: linkMatch[1],
                    publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
                    description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : '',
                    urlToImage: null
                });
            }
        });

        return articles;
    } catch (error) {
        console.error('RSS fetch error:', error);
        return [];
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}