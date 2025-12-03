// handlers/groupEvents.js

const path = require('path');
const fs = require('fs');

// Simple JSON file storage for group settings
const settingsPath = path.join(process.cwd(), 'data', 'group-settings.json');

// Load settings
function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    return {};
}

// Handle group participant updates
async function handleGroupParticipants(sock, update) {
    try {
        console.log('📢 Group participants update:', JSON.stringify(update, null, 2)); // Debug log
        
        const { id, participants, action } = update;
        
        if (!id || !participants || !action) {
            console.log('⚠️ Missing required fields in update');
            return;
        }

        // Load settings
        const settings = loadSettings();
        const groupSettings = settings[id] || {};

        console.log(`Group ${id} settings:`, groupSettings); // Debug log

        // Prepare message context
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363418958316196@newsletter",
                newsletterName: "🎭 Kelvin Tech",
                serverMessageId: 200
            }
        };

        // Handle new members joining
        if (action === 'add' && groupSettings.welcome === true) {
            console.log('✅ Sending welcome message to:', participants);
            
            for (const participant of participants) {
                try {
                    const welcomeText = `👋 Welcome to the group, @${participant.split('@')[0]}!\n\nWe're glad to have you here!\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

                    await sock.sendMessage(id, {
                        text: welcomeText,
                        mentions: [participant],
                        contextInfo: contextInfo
                    });

                    console.log(`✅ Welcome sent to ${participant}`);
                } catch (err) {
                    console.error(`❌ Failed to send welcome to ${participant}:`, err.message);
                }
            }
        }

        // Handle members leaving or being removed
        if ((action === 'remove' || action === 'leave') && groupSettings.goodbye === true) {
            console.log('✅ Sending goodbye message to:', participants);
            
            for (const participant of participants) {
                try {
                    const goodbyeText = `👋 Goodbye @${participant.split('@')[0]}!\n\nWe'll miss you. Take care!\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

                    await sock.sendMessage(id, {
                        text: goodbyeText,
                        mentions: [participant],
                        contextInfo: contextInfo
                    });

                    console.log(`✅ Goodbye sent to ${participant}`);
                } catch (err) {
                    console.error(`❌ Failed to send goodbye to ${participant}:`, err.message);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error handling group participants:', error);
    }
}

module.exports = { handleGroupParticipants };