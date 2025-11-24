// statusListener.js - Status viewing and reaction handler

let settings = {
    autoView: false,
    autoReact: false,
    reactionEmoji: '❤️',
    viewedCount: 0,
    reactedCount: 0,
    lastToggled: null
};

// Get current settings
function getSettings() {
    return { ...settings };
}

// Update settings
function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    console.log('📝 Settings updated:', settings);
    return settings;
}

// Initialize status listener
function initializeStatusListener(sock) {
    console.log('👁️ Status listener initialized');

    // Listen for status updates
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                // Check if it's a status message
                const isStatus = msg.key.remoteJid === 'status@broadcast';
                
                if (isStatus && settings.autoView) {
                    await viewStatus(sock, msg);
                }

                if (isStatus && settings.autoReact) {
                    await reactToStatus(sock, msg);
                }
            } catch (error) {
                console.error('❌ Status handling error:', error);
            }
        }
    });
}

// View a status
async function viewStatus(sock, msg) {
    try {
        const messageType = Object.keys(msg.message || {})[0];
        
        // Download media if present to mark as viewed
        if (['imageMessage', 'videoMessage'].includes(messageType)) {
            await sock.downloadMediaMessage(msg);
        }

        settings.viewedCount++;
        console.log(`👁️ Viewed status from ${msg.pushName || 'Unknown'} (Total: ${settings.viewedCount})`);
        
        return true;
    } catch (error) {
        console.error('❌ View status error:', error);
        return false;
    }
}

// React to a status
async function reactToStatus(sock, msg) {
    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: settings.reactionEmoji,
                key: msg.key
            }
        });

        settings.reactedCount++;
        console.log(`❤️ Reacted to status from ${msg.pushName || 'Unknown'} with ${settings.reactionEmoji}`);
        
        return true;
    } catch (error) {
        console.error('❌ React status error:', error);
        return false;
    }
}

module.exports = {
    getSettings,
    updateSettings,
    initializeStatusListener,
    viewStatus,
    reactToStatus
};