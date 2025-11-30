// commands/info.js

const { templates } = require('../tmp/templates');

function getBotInfo(config) {

    return {

        name: 'OVRICA-V1',

        owner: 'KELVIN AGBE',

        prefix: '/',

        version: '1.0.0',

        timezone: 'Africa/Lagos',

        platform: 'LINUX',

        runtime: process.version,

        cpu: 'Intel(R) Xeon(R) CPU E5-1620 v2 @ 3.70GHz',

        totalRam: '32050MB',

        mode: config.mode || 'Public',

        mood: '🌙'

    };

}

module.exports = {

    name: 'info',

    admin: false,

    description: 'Bot information',

    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {

        const CONFIG = require('../config');

        const messageQueue = require('../index').messageQueue;

        const uptime = process.uptime();

        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const chats = messageQueue.size;

        

        const text = templates.info(uptime, memory, chats, isAdmin, CONFIG.admins.length, getBotInfo(CONFIG));

        await sendWithTyping(sock, from, { text });

    }

};