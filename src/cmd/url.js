// commands/url.js - Upload images to Catbox and manage URLs

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Path to store URLs
const URL_STORAGE_PATH = path.join(__dirname, '../data/uploaded_urls.json');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing URLs
function loadUrls() {
    try {
        if (fs.existsSync(URL_STORAGE_PATH)) {
            const data = fs.readFileSync(URL_STORAGE_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading URLs:', error);
    }
    return { uploads: [] };
}

// Save URL to storage
function saveUrl(urlData) {
    try {
        const storage = loadUrls();
        storage.uploads.unshift(urlData); // Add to beginning
        
        // Keep only last 100 uploads
        if (storage.uploads.length > 100) {
            storage.uploads = storage.uploads.slice(0, 100);
        }
        
        fs.writeFileSync(URL_STORAGE_PATH, JSON.stringify(storage, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving URL:', error);
        return false;
    }
}

// Upload to Catbox
async function uploadToCatbox(buffer, filename) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, filename);

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        return response.data;
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

module.exports = {
    name: 'url',
    admin: false,
    description: 'Upload image to Catbox or view all uploaded URLs',
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            // Check if user wants to see links
            if (args[0] === 'links' || args[0] === 'list' || args[0] === 'all') {
                const storage = loadUrls();
                
                if (storage.uploads.length === 0) {
                    return await sendWithTyping(
                        sock,
                        from,
                        '📭 *No uploaded images yet!*\n\n' +
                        '💡 Upload an image using: /url (reply to image)'
                    );
                }

                // Create links message
                let linksMessage = `📚 *Uploaded Images History*\n` +
                    `━━━━━━━━━━━━━━━━━\n` +
                    `📊 *Total Uploads:* ${storage.uploads.length}\n\n`;

                // Show last 20 uploads
                const displayCount = Math.min(storage.uploads.length, 20);
                
                for (let i = 0; i < displayCount; i++) {
                    const upload = storage.uploads[i];
                    const date = new Date(upload.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    linksMessage += `${i + 1}. 📎 ${upload.filename}\n` +
                        `   🔗 ${upload.url}\n` +
                        `   📅 ${date}\n` +
                        `   💾 ${upload.size}\n\n`;
                }

                if (storage.uploads.length > 20) {
                    linksMessage += `\n_Showing 20 of ${storage.uploads.length} uploads_`;
                }

                linksMessage += `\n\n━━━━━━━━━━━━━━━━━\n` +
                    `💡 *Commands:*\n` +
                    `• /url links - View all links\n` +
                    `• /url clear - Clear history (Admin)\n` +
                    `• /url - Upload new image`;

                await sock.sendMessage(from, {
                    text: linksMessage,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "📚 Upload History",
                            body: `${storage.uploads.length} Images Stored`,
                            thumbnailUrl: storage.uploads[0]?.url || "https://files.catbox.moe/0r5agb.jpg",
                            sourceUrl: storage.uploads[0]?.url,
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });

                return;
            }

            // Clear history (Admin only)
            if (args[0] === 'clear' && isAdmin) {
                fs.writeFileSync(URL_STORAGE_PATH, JSON.stringify({ uploads: [] }, null, 2));
                return await sendWithTyping(
                    sock,
                    from,
                    '✅ *Upload history cleared successfully!*'
                );
            }

            // Check if message has quoted image or is an image itself
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = quotedMsg?.imageMessage || msg.message?.imageMessage;
            
            if (!imageMsg) {
                return await sendWithTyping(
                    sock, 
                    from, 
                    '❌ *Please reply to an image or send an image with this command!*\n\n' +
                    '📝 *Usage:*\n' +
                    '• /url - Upload image (reply to image)\n' +
                    '• /url links - View all uploaded URLs\n' +
                    '• /url clear - Clear history (Admin only)\n\n' +
                    '💡 Send image with caption /url or reply to image'
                );
            }

            // Send processing message
            await sendWithTyping(sock, from, '⏳ *Uploading image to Catbox...*');

            // Download the image
            const buffer = await downloadMediaMessage(
                { message: quotedMsg || msg.message },
                'buffer',
                {},
                { 
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            // Generate filename
            const timestamp = Date.now();
            const filename = `ovrica_${timestamp}.jpg`;

            // Upload to Catbox
            const url = await uploadToCatbox(buffer, filename);

            // Prepare upload data
            const uploadData = {
                url: url,
                filename: filename,
                size: `${(buffer.length / 1024).toFixed(2)} KB`,
                timestamp: new Date().toISOString(),
                uploadedBy: from,
                date: new Date().toLocaleString('en-US', { 
                    timeZone: 'Africa/Lagos',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                })
            };

            // Save to storage
            saveUrl(uploadData);

            // Get total uploads count
            const storage = loadUrls();

            // Send success message with fancy reply
            const successMessage = `✅ *Image Uploaded Successfully!*\n\n` +
                `🔗 *URL:* ${url}\n\n` +
                `📊 *File Size:* ${uploadData.size}\n` +
                `📅 *Date:* ${uploadData.date}\n` +
                `📚 *Total Uploads:* ${storage.uploads.length}\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `💡 *View all uploads:* /url links\n` +
                `💾 *This URL is permanent and can be shared anywhere!*`;

            await sock.sendMessage(from, {
                text: successMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    },
                    externalAdReply: {
                        title: "📤 Image Upload Success",
                        body: `Upload #${storage.uploads.length} • OVRICA Bot`,
                        thumbnailUrl: url,
                        sourceUrl: url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg });

            console.log(`✅ Image uploaded: ${url} | Total: ${storage.uploads.length}`);

        } catch (error) {
            console.error('❌ URL command error:', error);
            
            let errorMessage = '❌ *Upload Failed!*\n\n';
            
            if (error.message.includes('Not an image')) {
                errorMessage += '📝 *Reason:* The file is not a valid image\n' +
                    '✅ *Supported:* JPG, PNG, GIF, WebP';
            } else if (error.message.includes('too large')) {
                errorMessage += '📝 *Reason:* File size is too large\n' +
                    '✅ *Max Size:* 200MB';
            } else {
                errorMessage += `📝 *Reason:* ${error.message}\n\n` +
                    '💡 *Try:* Sending a smaller image or trying again';
            }
            
            await sendWithTyping(sock, from, errorMessage);
        }
    }
};