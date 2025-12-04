const gis = require('g-i-s');
const axios = require('axios');
const { MessageType } = require('@whiskeysockets/baileys');

/**
 * Image Search Command Handler
 * Usage: .img <search query> or .image <search query>
 */

const imageSearch = async (sock, msg, args) => {
  try {
    const chatId = msg.key.remoteJid;
    const query = args.join(' ');

    // Validate input
    if (!query || query.trim() === '') {
      await sock.sendMessage(chatId, {
        text: '❌ Please provide a search query!\n\nUsage: .img <search term>\nExample: .img cute cats'
      });
      return;
    }

    // Send searching message
    await sock.sendMessage(chatId, {
      text: `🔍 Searching for images: *${query}*\nPlease wait...`
    });

    // Search for images
    const searchOptions = {
      searchTerm: query,
      queryStringAddition: '&tbs=isz:m', // Medium size images
      filterOutDomains: ['pinterest.com'] // Optional: filter out certain domains
    };

    gis(searchOptions, async (error, results) => {
      if (error) {
        console.error('Image search error:', error);
        await sock.sendMessage(chatId, {
          text: '❌ An error occurred while searching for images. Please try again later.'
        });
        return;
      }

      if (!results || results.length === 0) {
        await sock.sendMessage(chatId, {
          text: `❌ No images found for: *${query}*\n\nTry a different search term.`
        });
        return;
      }

      // Get first 5 valid images
      let sentCount = 0;
      const maxImages = 5;

      for (let i = 0; i < results.length && sentCount < maxImages; i++) {
        try {
          const imageUrl = results[i].url;
          
          // Download image
          const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const imageBuffer = Buffer.from(response.data);

          // Send image
          await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `📸 *Image ${sentCount + 1}/${maxImages}*\n\n🔍 Query: ${query}\n🌐 Source: ${results[i].url.substring(0, 50)}...`
          });

          sentCount++;

          // Small delay between sends
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (imgError) {
          console.log(`Failed to send image ${i + 1}:`, imgError.message);
          // Continue to next image
          continue;
        }
      }

      if (sentCount === 0) {
        await sock.sendMessage(chatId, {
          text: '❌ Could not download any images. The images may be protected or unavailable.'
        });
      } else if (sentCount < maxImages) {
        await sock.sendMessage(chatId, {
          text: `✅ Sent ${sentCount} image(s) for: *${query}*\n\n(Some images were unavailable)`
        });
      }

    });

  } catch (error) {
    console.error('Image search command error:', error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ An unexpected error occurred. Please try again.'
    });
  }
};

// Alternative implementation using Cheerio (web scraping method)
const imageSearchScraper = async (sock, msg, args) => {
  try {
    const cheerio = require('cheerio');
    const chatId = msg.key.remoteJid;
    const query = args.join(' ');

    if (!query || query.trim() === '') {
      await sock.sendMessage(chatId, {
        text: '❌ Please provide a search query!\n\nUsage: .img <search term>'
      });
      return;
    }

    await sock.sendMessage(chatId, {
      text: `🔍 Searching for: *${query}*...`
    });

    // Search Google Images
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const imageUrls = [];

    // Extract image URLs from page
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && src.startsWith('http')) {
        imageUrls.push(src);
      }
    });

    if (imageUrls.length === 0) {
      await sock.sendMessage(chatId, {
        text: '❌ No images found. Try a different search term.'
      });
      return;
    }

    // Send first 3 images
    let sent = 0;
    for (let i = 0; i < Math.min(3, imageUrls.length); i++) {
      try {
        const imgResponse = await axios.get(imageUrls[i], {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        await sock.sendMessage(chatId, {
          image: Buffer.from(imgResponse.data),
          caption: `📸 Result ${i + 1} for: ${query}`
        });
        
        sent++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        continue;
      }
    }

    if (sent === 0) {
      await sock.sendMessage(chatId, {
        text: '❌ Could not download images.'
      });
    }

  } catch (error) {
    console.error('Scraper error:', error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ Search failed. Please try again.'
    });
  }
};

// Export the command
module.exports = {
  name: 'img',
  aliases: ['image', 'imgsearch', 'pics'],
  category: 'search',
  description: 'Search and send images from the web',
  usage: '.img <search query>',
  execute: imageSearch,
  alternateMethod: imageSearchScraper
};