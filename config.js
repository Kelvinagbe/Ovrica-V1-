require('dotenv').config();
const { loadJSON } = require('./utils/db-loader');

// ✅ Parse admins from .env (comma-separated)
function parseAdmins() {
    try {
        const adminString = process.env.ADMINS || '';
        if (!adminString.trim()) {
            console.log('⚠️  No admins found in .env - add ADMINS=2348109860102');
            return [];
        }

        // Split by comma and clean each number
        const admins = adminString
            .split(',')
            .map(num => num.trim())
            .filter(num => num.length > 0);

        console.log('✅ Loaded admins from .env:', admins);
        console.log('   Count:', admins.length);
        
        return admins;
    } catch (error) {
        console.error('❌ Error parsing admins:', error.message);
        return [];
    }
}

// Load data from JSON files
const settings = loadJSON('settings.json', {
    botMode: 'public',
    autoTyping: true,
    autoViewStatus: true,
    alwaysOnline: true,
    autoReact: false,
    sendWelcome: false,
    logMessages: false,
    logCommands: false,
    logErrors: true
});

const botInfo = loadJSON('botinfo.json', {
    botName: 'OVRICA-V1',
    version: '1.0.0',
    owner: 'KELVIN AGBE',
    ownerNumber: '2348109860102'
});

const CONFIG = {
    // From botinfo.json
    botName: botInfo.botName,
    version: botInfo.version,
    owner: botInfo.owner,
    ownerNumber: botInfo.ownerNumber,
    channelLink: botInfo.channelLink,
    newsletterJid: botInfo.newsletterJid,
    newsletterName: botInfo.newsletterName,
    channelUrl: botInfo.channelUrl,
    thumbnailUrl: botInfo.thumbnailUrl,

    // From settings.json
    botMode: settings.botMode,
    autoTyping: settings.autoTyping,
    autoViewStatus: settings.autoViewStatus,
    alwaysOnline: settings.alwaysOnline,
    autoReact: settings.autoReact,
    sendWelcome: settings.sendWelcome,
    logMessages: settings.logMessages,
    logCommands: settings.logCommands,
    logErrors: settings.logErrors,

    // ✅ Admins from .env
    admins: parseAdmins(),

    // Static config
    prefix: '/',
    platform: 'LINUX',
    timezone: 'Africa/Lagos',
    totalRam: '32050MB',
    cpu: 'Intel(R) Xeon(R) CPU E5-1620 v2 @ 3.70GHz',
    mode: 'Public',
    mood: '🌙',
    reactEmojis: ['❤️', '👍', '🔥', '😂', '😮', '👏', '✨', '🎉']
};

// ✅ Validate configuration
if (CONFIG.admins.length === 0) {
    console.log('⚠️  WARNING: No admins configured!');
    console.log('   Add to .env: ADMINS=2348109860102,1234567890');
}

module.exports = CONFIG;