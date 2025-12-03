// commands/welcome.js

const { templates } = require('../tmp/templates');
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

// Save settings
function saveSettings(settings) {
    try {
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

module.exports = {
    name: 'welcome',
    admin: true,
    description: 'Toggle welcome messages (on/off)',
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            const text = templates.error('This command can only be used in groups!');
            return await sendWithTyping(sock, from, { text });
        }

        if (args.length === 0) {
            const text = templates.error('Usage: /welcome <on|off>\n\nExample: /welcome on');
            return await sendWithTyping(sock, from, { text });
        }

        const action = args[0].toLowerCase();

        if (action !== 'on' && action !== 'off') {
            const text = templates.error('Invalid option! Use "on" or "off"\n\nExample: /welcome on');
            return await sendWithTyping(sock, from, { text });
        }

        try {
            // Load current settings
            const settings = loadSettings();
            
            // Initialize group settings if not exists
            if (!settings[from]) {
                settings[from] = {};
            }

            // Update welcome setting
            settings[from].welcome = (action === 'on');
            
            // Save settings
            saveSettings(settings);

            // Load local thumbnail
            const thumbnailPath = path.join(process.cwd(), 'assets', 'app.png');
            let thumbnailBuffer = null;

            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                console.log('⚠️ Thumbnail not found at assets/app.png');
            }

            const status = action === 'on' ? '✅ enabled' : '❌ disabled';
            const welcomeMessage = `Welcome messages have been ${status}!\n\n> POWERED 𝐊𝐄𝐋𝐕𝐈𝐍 𝐀𝐆𝐁𝐄`;

            // Prepare message options
            const messageOptions = {
                text: welcomeMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    }
                }
            };

            await sock.sendMessage(from, messageOptions, { quoted: msg });

        } catch (error) {
            console.error('Welcome error:', error);
            const text = templates.error(`Failed to toggle welcome: ${error.message}`);
            await sendWithTyping(sock, from, { text });
        }
    }
};