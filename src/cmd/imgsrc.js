
const gis = require('g-i-s');
const axios = require('axios');

module.exports = {
  name: 'img',
  aliases: ['image', 'imgsearch', 'picture', 'pic'],
  category: 'search',
  description: 'Search and download images',
  usage: 'img <query>',
  
  async execute(sock, msg, args) {
    try {
      const chatId = msg.key.remoteJid;
      const query = args.join(' ');

      if (!query) {
        return await sock.sendMessage(chatId, {
          text: '❌ *Usage:* .img <search query>\n*Example:* .img nature wallpaper'
        });
      }

      await sock.sendMessage(chatId, {
        text: `🔍 Searching: *${query}*...`
      });

      gis({ searchTerm: query }, async (error, results) => {
        if (error || !results || results.length === 0) {
          return await sock.sendMessage(chatId, {
            text: '❌ No results found.'
          });
        }

        let sent = 0;
        for (let i = 0; i < Math.min(5, results.length); i++) {
          try {
            const res = await axios.get(results[i].url, {
              responseType: 'arraybuffer',
              timeout: 10000,
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            await sock.sendMessage(chatId, {
              image: Buffer.from(res.data),
              caption: `📷 ${sent + 1} - ${query}`
            });

            sent++;
            await new Promise(r => setTimeout(r, 1500));
          } catch (e) {
            continue;
          }
        }

        if (sent === 0) {
          await sock.sendMessage(chatId, { text: '❌ Download failed.' });
        }
      });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Error occurred.'
      });
    }
  }
};

// METHOD 3: Simple handler for inline registration
const handleImageSearch = async (sock, msg, args) => {
  const chatId = msg.key.remoteJid;
  const query = args.join(' ');

  if (!query) {
    return sock.sendMessage(chatId, {
      text: '❌ Usage: .img <query>'
    });
  }

  sock.sendMessage(chatId, { text: `🔍 Searching: ${query}...` });

  gis({ searchTerm: query }, async (err, results) => {
    if (err || !results?.length) {
      return sock.sendMessage(chatId, { text: '❌ No results.' });
    }

    for (let i = 0; i < Math.min(3, results.length); i++) {
      try {
        const { data } = await axios.get(results[i].url, {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        await sock.sendMessage(chatId, {
          image: Buffer.from(data),
          caption: `📸 ${i + 1} - ${query}`
        });

        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        continue;
      }
    }
  });
};

// Export based on your bot structure
// Uncomment the one you need:

// For direct function export:
// module.exports = handleImageSearch;

// For object export:
// module.exports = { name: 'img', execute: handleImageSearch };

// For multiple exports:
// module.exports = { 