// statusListener.js - Main handler for auto-viewing and reacting to statuses

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// In-memory settings
let settings = {
    autoView: false,
    autoReact: false,
    reactionEmoji: '👍',
    viewedCount: 0,
    reactedCount: 0,
    lastToggled: null
};

// Get settings
function getSettings() {
    return settings;
}

// Update settings
function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
}

// Main status listener - Add this to your bot's message handler
async function handleStatusUpdates(sock, msg) {
    try {
        // Check if message is a status update
        if (!msg.key || !msg.key.remoteJid) return;
        
        const isStatus = msg.key.remoteJid === 'status@broadcast';
        
        if (!isStatus) return;
        
        console.log('📱 Status detected from:', msg.key.participant || 'Unknown');
        
        // Auto-view status
        if (settings.autoView) {
            await autoViewStatus(sock, msg);
        }
        
        // Auto-react to status
        if (settings.autoReact) {
            await autoReactStatus(sock, msg);
        }
        
    } catch (error) {
        console.error('❌ Error handling status:', error);
    }
}

// Auto-view status
async function autoViewStatus(sock, msg) {
    try {
        const { message } = msg;
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = sender.split('@')[0];
        
        // Determine status type
        let statusType = 'unknown';
        
        if (message.imageMessage) {
            statusType = 'image';
            // Download to mark as viewed
            try {
                await downloadMediaMessage(msg, 'buffer', {}, {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                });
            } catch (e) {
                console.log('Could not download image, but marked as viewed');
            }
        } else if (message.videoMessage) {
            statusType = 'video';
            // Download to mark as viewed
            try {
                await downloadMediaMessage(msg, 'buffer', {}, {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                });
            } catch (e) {
                console.log('Could not download video, but marked as viewed');
            }
        } else if (message.conversation) {
            statusType = 'text';
        } else if (message.extendedTextMessage) {
            statusType = 'text';
        }
        
        // Increment view counter
        settings.viewedCount++;
        
        console.log(`👁️ Auto-viewed ${statusType} status from +${senderNumber} (Total: ${settings.viewedCount})`);
        
    } catch (error) {
        console.error('Error auto-viewing status:', error);
    }
}

// Auto-react to status
async function autoReactStatus(sock, msg) {
    try {
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = sender.split('@')[0];
        
        // Send reaction to status
        await sock.sendMessage('status@broadcast', {
            react: {
                text: settings.reactionEmoji,
                key: msg.key
            }
        });
        
        // Increment react counter
        settings.reactedCount++;
        
        console.log(`🎭 Auto-reacted ${settings.reactionEmoji} to status from +${senderNumber} (Total: ${settings.reactedCount})`);
        
    } catch (error) {
        console.error('Error auto-reacting to status:', error);
    }
}

// Export everything
module.exports = {
    handleStatusUpdates,
    getSettings,
    updateSettings,
    autoViewStatus,
    autoReactStatus
};