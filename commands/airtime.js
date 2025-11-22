// commands/data.js - Fake Data Transaction with Fancy Reply

module.exports = {
    name: 'data',
    admin: false,
    description: 'Send fake data transaction (reply to someone)',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        try {
            // Helper function for fancy reply
            const sendFancyReply = async (text, quoted = msg) => {
                return await sock.sendMessage(from, {
                    text: text,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363401559573199@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "📱 Data Transaction",
                            body: "OVRICA WhatsApp Bot",
                            thumbnailUrl: "https://files.catbox.moe/m3o9wj.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VajVvKSCWEKKfVvSBy1D",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: quoted });
            };
            
            // Check if replying to someone
            let targetJid;
            let targetName = 'User';
            
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = msg.message.extendedTextMessage.contextInfo.participant;
                targetName = msg.message.extendedTextMessage.contextInfo.pushName || 'User';
            } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else {
                const usage = `┌ ❏ *⌜ DATA TRANSFER ⌟* ❏
│
├◆ How to use:
├◆ 1. Reply to someone's message
├◆ 2. Type /data <amount>
├◆ 3. Fake transaction sent!
├◆ 
├◆ Examples:
├◆ /data 500mb
├◆ /data 1gb
├◆ /data 2.5gb
├◆ /data 100mb
├◆ 
├◆ Note: Reply to the person first!
└ ❏

> Powered by 🎭Kelvin🎭`;
                
                return await sendFancyReply(usage);
            }
            
            // Get data amount from args or use default
            let dataAmount = '500MB';
            if (args.length > 0) {
                dataAmount = args[0].toUpperCase();
                // Add MB/GB if not specified
                if (!dataAmount.includes('MB') && !dataAmount.includes('GB')) {
                    dataAmount = dataAmount + 'MB';
                }
            }
            
            const targetNumber = targetJid.split('@')[0];
            
            // Generate transaction details
            const transactionId = generateTransactionId();
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            const date = now.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const day = now.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Create realistic transaction message
            const transactionMsg = `╔══════════════════════════╗
║   📱 DATA TRANSACTION    ║
╚══════════════════════════╝

✅ *TRANSACTION SUCCESSFUL*

┌─────────────────────────
│ 📊 TRANSACTION DETAILS
├─────────────────────────
│ 📦 Amount: ${dataAmount}
│ 📱 Recipient: ${targetName}
│ 📞 Number: +${targetNumber}
│ 💳 Status: COMPLETED
│ ⚡ Speed: Instant Transfer
└─────────────────────────

┌─────────────────────────
│ 🔐 TRANSACTION INFO
├─────────────────────────
│ 🆔 Transaction ID: 
│    ${transactionId}
│ 
│ ⏰ Time: ${time}
│ 📅 Date: ${date}
│ 📆 Day: ${day}
│ 
│ 🌍 Network: MTN Nigeria
│ 📡 Type: Direct Transfer
└─────────────────────────

┌─────────────────────────
│ ℹ️ ADDITIONAL INFO
├─────────────────────────
│ • Validity: 30 Days
│ • Network: 4G/5G
│ • Rollover: Enabled
│ • Bonus: +50MB Free
└─────────────────────────

✨ Thank you for using our service!
🔄 Transaction processed instantly

> Powered by 🎭Kelvin🎭`;
            
            // Send with fancy reply
            await sendFancyReply(transactionMsg);
            
            console.log(`📊 Fake data transaction sent: ${dataAmount} to ${targetNumber}`);
            
        } catch (error) {
            console.error('❌ Data command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to process transaction. Please try again!');
        }
    }
};

// Helper function to generate realistic transaction ID
function generateTransactionId() {
    const prefix = 'TXN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}