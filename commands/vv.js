// ============================================
// FILE 1: commands/vv.js - View Once Media Revealer
// Reply to a view once message with /vv to see it
// ============================================

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'vv',
    admin: false,
    description: 'Reveal view once media - Reply to view once message with /vv',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            // Check if replying to a message
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quotedMsg) {
                const usage = `┌ ❏ *⌜ VIEW ONCE REVEALER ⌟* ❏
│
├◆ How to use:
├◆ 1. Reply to a view once message
├◆ 2. Type /vv
├◆ 3. Bot will reveal the media
├◆ 
├◆ Supported:
├◆ ✅ View once images
├◆ ✅ View once videos
├◆ 
├◆ Note: Reply to the view once message!
└ ❏

> Powered by 🎭Kelvin🎭`;
                
                return await sendWithTyping(sock, from, usage);
            }
            
            // Check if quoted message is a view once message
            const viewOnceMsg = quotedMsg.viewOnceMessageV2?.message || 
                               quotedMsg.viewOnceMessage?.message;
            
            if (!viewOnceMsg) {
                return await sendWithTyping(sock, from, '❌ That is not a view once message! Reply to a view once message with /vv');
            }
            
            // Check if it's an image or video
            if (!viewOnceMsg.imageMessage && !viewOnceMsg.videoMessage) {
                return await sendWithTyping(sock, from, '❌ Unsupported view once type!');
            }
            
            const mediaType = viewOnceMsg.imageMessage ? 'image' : 'video';
            const sender = msg.message.extendedTextMessage.contextInfo.participant || from;
            const senderNumber = sender.split('@')[0];
            
            await sendWithTyping(sock, from, `⏳ Revealing view once ${mediaType}...\nPlease wait...`);
            
            // Download the media
            const buffer = await downloadMediaMessage(
                { 
                    message: viewOnceMsg,
                    type: mediaType
                },
                'buffer',
                {}
            );
            
            // Create downloads folder if doesn't exist
            const downloadsDir = path.join(__dirname, '../downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }
            
            // Save file
            const timestamp = Date.now();
            const extension = mediaType === 'image' ? 'jpg' : 'mp4';
            const fileName = `viewonce_${senderNumber}_${timestamp}.${extension}`;
            const filePath = path.join(downloadsDir, fileName);
            
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ View Once revealed: ${fileName}`);
            
            const caption = `┌ ❏ *⌜ VIEW ONCE REVEALED ⌟* ❏
│
├◆ Type: ${mediaType.toUpperCase()}
├◆ From: +${senderNumber}
├◆ Size: ${(buffer.length / 1024).toFixed(2)} KB
├◆ Status: ✅ Revealed
├◆ Saved: ${fileName}
├◆ 
├◆ 👀 Here's what they sent!
└ ❏

> Powered by 🎭Kelvin🎭`;
            
            // Send the revealed media
            if (mediaType === 'image') {
                await sock.sendMessage(from, {
                    image: buffer,
                    caption: caption
                });
            } else {
                await sock.sendMessage(from, {
                    video: buffer,
                    caption: caption
                });
            }
            
            console.log(`✅ View once ${mediaType} revealed to ${from}`);
            
        } catch (error) {
            console.error('❌ View once reveal error:', error);
            await sendWithTyping(sock, from, `❌ Failed to reveal view once: ${error.message}`);
        }
    }
};
