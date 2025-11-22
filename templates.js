// templates.js - Professional message templates with optimized design

const getServerStatus = () => {

    const uptime = process.uptime();

    const days = Math.floor(uptime / 86400);

    const hours = Math.floor((uptime % 86400) / 3600);

    const minutes = Math.floor((uptime % 3600) / 60);

    

    return {

        uptime: `${days}d ${hours}h ${minutes}m`,

        status: '✅ Online',

        timestamp: new Date().toLocaleString(),

        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`

    };

};

const footer = '\n> Powered by 🎭Kelvin🎭';

// Reusable design components

const design = {

    // Creates the top header with bot info (for menu only)

    topHeader: (botInfo) => {

        const status = getServerStatus();

        return `┌ ❏ *⌜ ${botInfo.name || 'OVRICA-V1'} ⌟* ❏ 

│

├◆ ᴏᴡɴᴇʀ: ${botInfo.owner || 'KELVIN AGBE'}

├◆ ᴘʀᴇғɪx: ${botInfo.prefix || '.'}

├◆ ᴜsᴇʀ: ${botInfo.user || 'User'}

├◆ ᴘʟᴀɴ: ${botInfo.plan || 'Free User'}

├◆ ᴠᴇʀsɪᴏɴ: ${botInfo.version || '1.0.0'}

├◆ ᴛɪᴍᴇ: ${new Date().toLocaleTimeString('en-US', { timeZone: botInfo.timezone || 'Africa/Lagos' })} (${botInfo.timezone || 'Africa/Lagos'})

├◆ ᴜᴘᴛɪᴍᴇ: ${status.uptime}

├◆ ᴄᴏᴍᴍᴀɴᴅs: ${botInfo.commandCount || '0'}

├◆ ᴛᴏᴅᴀʏ: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

├◆ ᴅᴀᴛᴇ: ${new Date().toLocaleDateString('en-GB')}

├◆ ᴘʟᴀᴛғᴏʀᴍ: ${botInfo.platform || 'LINUX'}

├◆ ʀᴜɴᴛɪᴍᴇ: ${botInfo.runtime || process.version}

├◆ ᴄᴘᴜ: ${botInfo.cpu || 'N/A'}

├◆ ʀᴀᴍ: ${status.memory} / ${botInfo.totalRam || '32050MB'} (${((parseFloat(status.memory) / parseFloat(botInfo.totalRam || '32050')) * 100).toFixed(1)}%)

├◆ ᴍᴏᴅᴇ: ${botInfo.mode || 'Public'}

├◆ ᴍᴏᴏᴅ: ${botInfo.mood || '🌙'}

└ ◆`;

    },

    

    // Simple header for other commands

    simpleHeader: (title) => `┌ ❏ *⌜ ${title} ⌟* ❏`,

    

    // Creates a section header

    section: (title) => `┌ ❏ ◆ *⌜${title}⌟* ◆\n│`,

    

    // Creates a command item

    item: (command) => `├◆ ${command}`,

    

    // Closes a section

    footer: () => `│\n└ ❏`,

    

    // Info line for status displays

    info: (label, value) => `├◆ ${label}: ${value}`,

    

    // Simple separator

    separator: () => `│`,

    

    // Build complete menu from sections (with full header)

    buildMenu: (topInfo, sections) => {

        let menu = design.topHeader(topInfo);

        

        sections.forEach(section => {

            menu += '\n' + design.section(section.title);

            section.items.forEach(item => {

                menu += '\n' + design.item(item);

            });

            menu += '\n' + design.footer();

        });

        

        return menu + footer;

    },

    

    // Build simple display (without full header)

    buildSimple: (title, sections) => {

        let display = design.simpleHeader(title);

        

        sections.forEach(section => {

            display += '\n' + design.section(section.title);

            section.items.forEach(item => {

                display += '\n' + design.item(item);

            });

            display += '\n' + design.footer();

        });

        

        return display + footer;

    },

    

    // Build info display (without full header)

    buildInfoSimple: (title, infoSections) => {

        let info = design.simpleHeader(title);

        

        infoSections.forEach(section => {

            info += '\n' + design.section(section.title);

            section.items.forEach(item => {

                info += '\n' + design.info(item.label, item.value);

            });

            info += '\n' + design.footer();

        });

        

        return info + footer;

    }

};

const templates = {

    welcome: (name, botInfo = {}) => {

        const sections = [

            {

                title: 'WELCOME MESSAGE',

                items: [

                    `👋 Welcome ${name}!`,

                    '🤖 WhatsApp Bot Assistant',

                    '✨ Type /menu to get started'

                ]

            },

            {

                title: 'QUICK ACCESS',

                items: [

                    '/menu - Main menu',

                    '/help - Command guide',

                    '/features - Bot features',

                    '/ping - Test bot'

                ]

            }

        ];

        

        return design.buildMenu(botInfo, sections);

    },

    menu: (botInfo = {}) => {

        const sections = [

            {

                title: 'GENERAL COMMANDS',

                items: [

                    '/menu - Display main menu',

                    '/help - Show all commands',

                    '/info - Bot information',

                    '/ping - Test response',

                    '/time - Server time',

                    '/features - Active features',

                    '/settings - View config'

                ]

            },

            {

                title: 'GROUP COMMANDS',

                items: [

                    '/tagall - Tag all members',

                    '/hidetag <message> - Hidden tag all',
                    

                    '/userinfo - get user information'

                ]

            },

            {

                title: 'BOT CONTROLS',

                items: [

                    '/autotyping <on/off> - Toggle typing',

                    '/alwaysonline <on/off> - Toggle online',

                    '/statusview <on/off> - Toggle status view',

                    '/autoreact <on/off> - Toggle reactions'

                ]

            },
            {

    title: 'VIEW ONCE & MEDIA',

    items: [

        '/vv - Reveal view once (reply to message)',

        '/pp - Get profile picture (reply/mention)',

        '/getpfp - Get profile picture (detailed)',

        '/steal - Steal profile picture'

    ]

},

            {
                title: 'FUN & TOOLS',

                items: [

                    '/echo <text> - Echo message',

                    '/reverse <text> - Reverse text',

                    '/count <text> - Word counter'

                ]

            },

            {

                title: 'MEDIA TOOLS',

                items: [

                    '/sticker - Convert image to sticker',

                    '/toimage - Convert sticker to image'

                ]

            },

            {

                title: 'ADMIN ONLY',

                items: [

                    '/broadcast <msg> - Mass send',

                    '/admins - View admin list',

                    '/stats - Detailed statistics'

                ]

            }

        ];

        

        return design.buildMenu(botInfo, sections);

    },

    help: (isAdmin, botInfo = {}) => {

        const sections = [

            {

                title: 'GENERAL COMMANDS',

                items: [

                    '/menu - Display main menu',

                    '/help - Show this guide',

                    '/info - Bot information',

                    '/ping - Check bot status',

                    '/time - Server time',

                    '/features - Active features',

                    '/settings - View config'

                ]

            },

            {

                title: 'FUN COMMANDS',

                items: [

                    '/echo <text> - Echo your message',

                    '/reverse <text> - Reverse text',

                    '/count <text> - Word counter'

                ]

            },

            {

                title: 'MEDIA TOOLS',

                items: [

                    '/sticker - Convert image',

                    '  └ Reply to image with /sticker',

                    '/toimage - Convert sticker',

                    '  └ Reply to sticker with /toimage'

                ]

            }

        ];

        

        if (isAdmin) {

            sections.push({

                title: 'ADMIN COMMANDS',

                items: [

                    '/broadcast <message> - Send to all chats',

                    '/admins - View admin list',

                    '/stats - Detailed statistics'

                ]

            });

        }

        

        return design.buildSimple('COMMAND GUIDE', sections);

    },

    features: (config, botInfo = {}) => {

        const infoSections = [

            {

                title: 'AUTOMATION STATUS',

                items: [

                    { label: 'Auto Typing', value: config.autoTyping ? '✅ Active' : '❌ Inactive' },

                    { label: 'Auto React', value: config.autoReact ? '✅ Active' : '❌ Inactive' },

                    { label: 'Auto Status View', value: config.autoViewStatus ? '✅ Active' : '❌ Inactive' },

                    { label: 'Always Online', value: config.alwaysOnline ? '✅ Active' : '❌ Inactive' }

                ]

            },

            {

                title: 'CAPABILITIES',

                items: [

                    { label: '✅ Sticker Creation', value: 'Available' },

                    { label: '✅ Media Conversion', value: 'Available' },

                    { label: '✅ Text Processing', value: 'Available' },

                    { label: '✅ Admin Management', value: 'Available' },

                    { label: '✅ Broadcast System', value: 'Available' }

                ]

            }

        ];

        

        return design.buildInfoSimple('BOT FEATURES', infoSections);

    },

    info: (uptime, memory, chats, isAdmin, adminCount, botInfo = {}) => {

        const up = uptime;

        const d = Math.floor(up / 86400);

        const h = Math.floor((up % 86400) / 3600);

        const min = Math.floor((up % 3600) / 60);

        const uptimeStr = `${d}d ${h}h ${min}m`;

        

        const infoSections = [

            {

                title: 'SYSTEM INFO',

                items: [

                    { label: 'Status', value: '✅ Online' },

                    { label: 'Version', value: botInfo.version || '1.0.0' },

                    { label: 'Platform', value: 'WhatsApp Web' },

                    { label: 'Mode', value: 'Multi-Device' }

                ]

            },

            {

                title: 'PERFORMANCE',

                items: [

                    { label: 'Uptime', value: uptimeStr },

                    { label: 'Memory Usage', value: `${memory}MB` },

                    { label: 'Response Time', value: '<100ms' },

                    { label: 'Stability', value: '99.9%' }

                ]

            },

            {

                title: 'ACTIVITY',

                items: [

                    { label: 'Active Chats', value: chats },

                    { label: 'Commands Served', value: '1000+' },

                    ...(isAdmin ? [{ label: 'Total Admins', value: adminCount }] : []),

                    { label: 'Messages Today', value: '500+' }

                ]

            }

        ];

        

        return design.buildInfoSimple('BOT INFORMATION', infoSections);

    },

    settings: (config, botInfo = {}) => {

        const infoSections = [

            {

                title: 'AUTOMATION SETTINGS',

                items: [

                    { label: 'Auto Typing', value: config.autoTyping ? '✅ Enabled' : '❌ Disabled' },

                    { label: 'Auto React', value: config.autoReact ? '✅ Enabled' : '❌ Disabled' },

                    { label: 'Auto Status View', value: config.autoViewStatus ? '✅ Enabled' : '❌ Disabled' },

                    { label: 'Always Online', value: config.alwaysOnline ? '✅ Enabled' : '❌ Disabled' }

                ]

            },

            {

                title: 'ADMINISTRATION',

                items: [

                    { label: 'Registered Admins', value: config.admins.length },

                    { label: 'Admin Commands', value: 'Active' },

                    { label: 'Broadcast', value: 'Available' }

                ]

            }

        ];

        

        return design.buildInfoSimple('CONFIGURATION', infoSections);

    },

    ping: (latency, botInfo = {}) => {

        const status = getServerStatus();

        const infoSections = [

            {

                title: 'RESPONSE TEST',

                items: [

                    { label: 'Latency', value: `${latency}ms` },

                    { label: 'Status', value: '✅ Online' },

                    { label: 'Connection', value: 'Stable' },

                    { label: 'Response', value: 'Excellent' }

                ]

            },

            {

                title: 'SERVER STATUS',

                items: [

                    { label: 'Status', value: status.status },

                    { label: 'Uptime', value: status.uptime },

                    { label: 'Memory', value: status.memory }

                ]

            }

        ];

        

        return design.buildInfoSimple('PONG!', infoSections);

    },

    error: (message, botInfo = {}) => {

        const sections = [

            {

                title: 'ERROR',

                items: [

                    `❌ ${message}`,

                    '',

                    '💡 Suggestions:',

                    '  • Check command syntax',

                    '  • Use /help for guidance',

                    '  • Contact admin if persists'

                ]

            }

        ];

        

        return design.buildSimple('ERROR', sections);

    },

    adminOnly: (botInfo = {}) => {

        const sections = [

            {

                title: 'ACCESS DENIED',

                items: [

                    '⛔ Restricted Command',

                    '',

                    'This command is only available to',

                    'bot administrators.',

                    '',

                    '👑 Admin Features:',

                    '  • Broadcast messaging',

                    '  • User management',

                    '  • System statistics',

                    '  • Advanced controls',

                    '',

                    '💬 Contact: wa.me/2348109860102'

                ]

            }

        ];

        

        return design.buildSimple('ACCESS DENIED', sections);

    },

    // Simple text templates for quick responses

    simpleText: {

        time: (date, time, timezone, botInfo = {}) => {

            const infoSections = [

                {

                    title: 'SERVER TIME',

                    items: [

                        { label: '📅 Date', value: date },

                        { label: '⏰ Time', value: time },

                        { label: '🌍 Timezone', value: timezone },

                        { label: '🔄 Updated', value: 'Real-time' }

                    ]

                }

            ];

            return design.buildInfoSimple('SERVER TIME', infoSections);

        },

        

        echo: (text, botInfo = {}) => {

            const sections = [

                {

                    title: 'ECHO MESSAGE',

                    items: [text]

                }

            ];

            return design.buildSimple('ECHO', sections);

        },

        

        reversed: (text, botInfo = {}) => {

            const sections = [

                {

                    title: 'REVERSED TEXT',

                    items: [text]

                }

            ];

            return design.buildSimple('REVERSED TEXT', sections);

        },

        

        count: (words, chars, noSpace, botInfo = {}) => {

            const infoSections = [

                {

                    title: 'TEXT ANALYSIS',

                    items: [

                        { label: '📝 Words', value: words },

                        { label: '🔤 Characters', value: chars },

                        { label: '🔡 No Spaces', value: noSpace },

                        { label: '📏 Average', value: `${(chars/words).toFixed(2)} chars/word` }

                    ]

                }

            ];

            return design.buildInfoSimple('TEXT ANALYSIS', infoSections);

        },

        

        broadcastStart: (count, botInfo = {}) => {

            const sections = [

                {

                    title: 'BROADCASTING',

                    items: [

                        `⏳ Sending to ${count} chats...`,

                        'Please wait...'

                    ]

                }

            ];

            return design.buildSimple('BROADCASTING', sections);

        },

        

        broadcastComplete: (success, total, rate, botInfo = {}) => {

            const infoSections = [

                {

                    title: 'BROADCAST RESULTS',

                    items: [

                        { label: 'Sent', value: `${success}/${total}` },

                        { label: 'Success Rate', value: `${rate}%` },

                        { label: 'Failed', value: total - success },

                        { label: 'Status', value: '✅ Complete' }

                    ]

                }

            ];

            return design.buildInfoSimple('BROADCAST COMPLETE', infoSections);

        },

        

        adminList: (list, count, botInfo = {}) => {

            const sections = [

                {

                    title: 'ADMINISTRATORS',

                    items: [

                        ...list.split('\n'),

                        '',

                        `📊 Total Admins: ${count}`

                    ]

                }

            ];

            return design.buildSimple('ADMINISTRATORS', sections);

        },

        

        stats: (uptime, heapMB, totalMB, chats, statusViews, admins, timestamp, botInfo = {}) => {

            const infoSections = [

                {

                    title: 'SYSTEM STATS',

                    items: [

                        { label: '⏱️ Uptime', value: uptime },

                        { label: '💾 Heap', value: `${heapMB}MB` },

                        { label: '💾 Total', value: `${totalMB}MB` }

                    ]

                },

                {

                    title: 'ACTIVITY',

                    items: [

                        { label: 'Active Chats', value: chats },

                        { label: 'Status Views', value: statusViews },

                        { label: 'Admins', value: admins }

                    ]

                },

                {

                    title: 'TIMESTAMP',

                    items: [

                        { label: 'Generated', value: timestamp }

                    ]

                }

            ];

            return design.buildInfoSimple('BOT STATISTICS', infoSections);

        },

        

        stickerCreating: '⏳ Creating sticker...\nPlease wait...',

        stickerConverted: '✅ Sticker converted to image!',

        

        broadcast: (message, botInfo = {}) => {

            const sections = [

                {

                    title: 'BROADCAST MESSAGE',

                    items: [

                        message,

                        '',

                        '_Sent by Administrator_'

                    ]

                }

            ];

            return design.buildSimple('BROADCAST', sections);

        }

    }

};

// Export both templates and design utilities

module.exports = { templates, design };