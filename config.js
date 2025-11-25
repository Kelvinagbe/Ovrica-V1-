const { loadJSON } = require('./utils/db-loader');

// Load data from JSON files
const admins = loadJSON('admin.json', { admins: [] });
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
    
    // From admin.json
    admins: admins.admins,
    
    // Static config (doesn't change)
    prefix: '/',
    platform: 'LINUX',
    timezone: 'Africa/Lagos',
    totalRam: '32050MB',
    cpu: 'Intel(R) Xeon(R) CPU E5-1620 v2 @ 3.70GHz',
    mode: 'Public',
    mood: '🌙',
    reactEmojis: ['❤️', '👍', '🔥', '😂', '😮', '👏', '✨', '🎉']
};

module.exports = CONFIG;