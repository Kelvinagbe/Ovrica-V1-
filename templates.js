// templates.js - OVRICA-V1 Professional Message Templates

const getServerStatus = () => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return {
        uptime: `${days}d ${hours}h ${minutes}m`,
        status: '✅ *Online*',
        timestamp: new Date().toLocaleString(),
        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`
    };
};

const design = {
    // Premium header
    topHeader: (botInfo) => {
        const status = getServerStatus();
        return `╔══[❏ *𝗢𝗩𝗥𝗜𝗖𝗔 𝗩𝟭* ❏]
║➲ 𝗡𝗔𝗠𝗘: ${botInfo.name || 'OVRICA-V1'}
║➲ 𝗢𝗪𝗡𝗘𝗥: ${botInfo.owner || 'KELVIN AGBE'}
║➲ 𝗩𝗘𝗥𝗦𝗜𝗢𝗡: ${botInfo.version || 'v1.0.0'}
║➲ 𝗣𝗥𝗘𝗙𝗜𝗫: ${botInfo.prefix || '/'}
║➲ 𝗨𝗣𝗧𝗜𝗠𝗘: ${status.uptime}
║➲ 𝗠𝗘𝗠𝗢𝗥𝗬: ${status.memory}
╚══[❏`;
    },

    // Section header
    sectionHeader: (title) => {
        return `╔══[❏ *${title}* ❏]`;
    },

    // Command item (NOT bold)
    commandItem: (command) => {
        return `║➲ ${command}`;
    },

    // Info item (bold label, normal value)
    infoItem: (label, value) => {
        return `║➲ *${label}* ${value}`;
    },

    // Section footer
    sectionFooter: () => {
        return `╚══[❏`;
    },

    // Build menu from sections
    buildMenu: (botInfo, sections) => {
        let menu = design.topHeader(botInfo);
        
        sections.forEach(section => {
            menu += '\n\n' + design.sectionHeader(section.title);
            section.items.forEach(item => {
                menu += '\n' + design.commandItem(item);
            });
            menu += '\n' + design.sectionFooter();
        });
        
        return menu;
    },

    // Build info display
    buildInfo: (title, infoSections) => {
        let display = design.sectionHeader(title);
        
        infoSections.forEach(section => {
            display += '\n║\n║➲ *—— ' + section.title + ' ——*';
            section.items.forEach(item => {
                display += '\n' + design.infoItem(item.label, item.value);
            });
        });
        
        display += '\n' + design.sectionFooter();
        return display;
    }
};

const templates = {
    // Welcome message
    welcome: (name, botInfo = {}) => {
        const sections = [
            {
                title: '𝗪𝗘𝗟𝗖𝗢𝗠𝗘',
                items: [
                    '🎯 *Hello* ' + name,
                    '🤖 *WhatsApp Bot Assistant*',
                    '⚡ *Type /menu to get started*'
                ]
            },
            {
                title: '𝗤𝗨𝗜𝗖𝗞 𝗦𝗧𝗔𝗥𝗧',
                items: [
                    '/menu',
                    '/help',
                    '/ping'
                ]
            }
        ];
        return design.buildMenu(botInfo, sections);
    },

    // Main menu
    menu: (botInfo = {}) => {
        const sections = [
            {
                title: '𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗡𝗨',
                items: [
                    '/tagall',
                    '/hidetag'
                ]
            },
            {
                title: '𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 𝗠𝗘𝗡𝗨',
                items: [
                    '/play',
                    '/song',
                    '/music',
                    '/video',
                    '/instagram',
                    '/facebook',
                    '/tiktok',
                    '/youtube'
                ]
            },
            {
                title: '𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗠𝗘𝗡𝗨',
                items: [
                    '/sticker',
                   '/take'
                ]
            },
            {
                title: '𝗔𝗜 𝗠𝗘𝗡𝗨',
                items: [
                    '/txt2img',
                    
                ]
            },
            {
                title: '𝗣𝗢𝗪𝗘𝗥 𝗠𝗘𝗡𝗨',
                items: [
                    '/save',
                    '/vv',
                    '/tourl',
                    '/delete',
                    '/block',
                    '/unblock',
                    '/pair',
                    '/warnings'
                ]
            },
            {
                title: '𝗢𝗧𝗛𝗘𝗥',
                items: [
                    '/ping',
                    '/owner',
                    '/info',
                    '/steal',
                    '/admins'
                ]
            }
        ];
        return design.buildMenu(botInfo, sections);
    },

    // Help command
    help: (isAdmin, botInfo = {}) => {
        const sections = [
            {
                title: '𝗚𝗘𝗡𝗘𝗥𝗔𝗟 𝗜𝗡𝗙𝗢',
                items: [
                    '/menu - *Main menu*',
                    '/help - *Command guide*',
                    '/ping - *Test bot*',
                    '/info - *Bot information*'
                ]
            },
            {
                title: '𝗚𝗥𝗢𝗨𝗣 𝗧𝗬𝗣𝗘𝗦',
                items: [
                    '/ban *reply/mention*',
                    '/promote *reply/mention*',
                    '/kick *reply/mention*'
                ]
            }
        ];
        
        if (isAdmin) {
            sections.push({
                title: '𝗔𝗗𝗠𝗜𝗡 𝗢𝗡𝗘𝗟𝗬',
                items: [
                    '/broadcast *message*',
                    '/stats',
                    '/admins'
                ]
            });
        }
        
        return design.buildMenu(botInfo, sections);
    },

    // Bot info
    info: (uptime, memory, chats, botInfo = {}) => {
        const infoSections = [
            {
                title: '𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢',
                items: [
                    { label: '𝗦𝘁𝗮𝘁𝘂𝘀', value: '✅ Online' },
                    { label: '𝗣𝗹𝗮𝘁𝗳𝗼𝗿𝗺', value: 'WhatsApp Web' },
                    { label: '𝗠𝗼𝗱𝗲', value: 'Multi-Device' }
                ]
            },
            {
                title: '𝗣𝗘𝗥𝗙𝗢𝗥𝗠𝗔𝗡𝗖𝗘',
                items: [
                    { label: '⏱️ 𝗨𝗽𝘁𝗶𝗺𝗲', value: uptime },
                    { label: '💾 𝗠𝗲𝗺𝗼𝗿𝘆', value: memory + 'MB' },
                    { label: '⚡ 𝗦𝘁𝗮𝗯𝗶𝗹𝗶𝘁𝘆', value: '99.9%' }
                ]
            },
            {
                title: '𝗔𝗖𝗧𝗜𝗩𝗜𝗧𝗬',
                items: [
                    { label: '💬 𝗔𝗰𝘁𝗶𝘃𝗲 𝗖𝗵𝗮𝘁𝘀', value: chats },
                    { label: '⚙️ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀', value: '1000+' }
                ]
            }
        ];
        return design.buildInfo('𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡', infoSections);
    },

    // Ping/Pong
    ping: (latency, botInfo = {}) => {
        const status = getServerStatus();
        const infoSections = [
            {
                title: '𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘 𝗧𝗘𝗦𝗧',
                items: [
                    { label: '⚡ 𝗟𝗮𝘁𝗲𝗻𝗰𝘆', value: latency + 'ms' },
                    { label: '✅ 𝗦𝘁𝗮𝘁𝘂𝘀', value: 'Online' },
                    { label: '🔌 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻', value: 'Stable' }
                ]
            },
            {
                title: '𝗦𝗘𝗥𝗩𝗘𝗥 𝗦𝗧𝗔𝗧𝗨𝗦',
                items: [
                    { label: '📡 𝗦𝘁𝗮𝘁𝘂𝘀', value: status.status },
                    { label: '⏱️ 𝗨𝗽𝘁𝗶𝗺𝗲', value: status.uptime },
                    { label: '💾 𝗠𝗲𝗺𝗼𝗿𝘆', value: status.memory }
                ]
            }
        ];
        return design.buildInfo('𝗣𝗢𝗡𝗚!', infoSections);
    },

    // Features
    features: (config, botInfo = {}) => {
        const infoSections = [
            {
                title: '𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡',
                items: [
                    { label: '𝗧𝘆𝗽𝗶𝗻𝗴', value: config.autoTyping ? '✅ Active' : '❌ Inactive' },
                    { label: '𝗥𝗲𝗮𝗰𝘁', value: config.autoReact ? '✅ Active' : '❌ Inactive' },
                    { label: '𝗦𝘁𝗮𝘁𝘂𝘀 𝗩𝗶𝗲𝘄', value: config.autoViewStatus ? '✅ Active' : '❌ Inactive' }
                ]
            },
            {
                title: '𝗠𝗔𝗜𝗡 𝗣𝗥𝗢𝗠𝗣𝗘𝗧𝗦',
                items: [
                    { label: '✅ 𝗔𝗜 𝗘𝗻𝗴𝗶𝗻𝗲', value: 'Ready' },
                    { label: '✅ 𝗦𝘁𝗶𝗰𝗸𝗲𝗿𝘀', value: 'Ready' },
                    { label: '✅ 𝗗𝗼𝗪𝗻𝗹𝗼𝗮𝗱𝘀', value: 'Ready' }
                ]
            }
        ];
        return design.buildInfo('𝗕𝗢𝗧 𝗙𝗘𝗔𝗧𝗨𝗥𝗘𝗦', infoSections);
    },

    // Settings
    settings: (config, botInfo = {}) => {
        const infoSections = [
            {
                title: '𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡',
                items: [
                    { label: '𝗧𝘆𝗽𝗶𝗻𝗴', value: config.autoTyping ? '✅ Enabled' : '❌ Disabled' },
                    { label: '𝗥𝗲𝗮𝗰𝘁', value: config.autoReact ? '✅ Enabled' : '❌ Disabled' },
                    { label: '𝗢𝗻𝗹𝗶𝗻𝗲', value: config.alwaysOnline ? '✅ Enabled' : '❌ Disabled' }
                ]
            },
            {
                title: '𝗔𝗗𝗠𝗜𝗡 𝗖𝗢𝗡𝗧𝗥𝗢𝗟',
                items: [
                    { label: '𝗥𝗲𝗴𝗶𝘀𝘁𝗲𝗿𝗲𝗱', value: config.admins.length + ' Admins' },
                    { label: '𝗕𝗿𝗼𝗮𝗱𝗰𝗮𝘀𝘁', value: 'Available' }
                ]
            }
        ];
        return design.buildInfo('𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡', infoSections);
    },

    // Error
    error: (message, botInfo = {}) => {
        return `╔══[❏ *𝗘𝗥𝗥𝗢𝗥* ❏]══╗
║➲ *❌ ${message}*
║
║➲ *💡 𝗧𝗥𝗬:*
║➲ • *𝗖𝗵𝗲𝗰𝗸 𝗦𝗬𝗡𝗧𝗔𝗫*
║➲ • *𝗨𝘀𝗲 /help*
║➲ • *𝗖𝗼𝗻𝘁𝗮𝗰𝘁 𝗔𝗱𝗺𝗶𝗻*
╚═══[❏`;
    },

    // Admin Only
    adminOnly: (botInfo = {}) => {
        return `╔══[❏ *𝗔𝗖𝗖𝗘𝗦𝘀 𝗗𝗘𝗡𝗜𝗘𝗗* ❏]══╗
║➲ *⛔ 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗘𝗗*
║
║➲ *𝗧𝗵𝗶𝘀 𝗰𝗼𝗺𝗺𝗮𝗻𝗱 𝗜𝗦*
║➲ *𝗡𝗢𝗪 𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘 𝗧𝗢*
║➲ *𝗔𝗗𝗠𝗜𝗡𝗦 𝗢𝗡𝗟𝗬*
╚═══[❏`;
    },

    // Simple responses
    simpleText: {
        echo: (text) => {
            return `╔══[❏ *𝗘𝗖𝗛𝗢* ❏]
║➲ ${text}
╚══[❏`;
        },

        reversed: (text) => {
            return `╔══[❏ *𝗥𝗘𝗩𝗘𝗥𝗦𝗘𝗗* ❏]
║➲ ${text}
╚══[❏`;
        },

        count: (words, chars, noSpace) => {
            const infoSections = [
                {
                    title: '𝗞𝗘𝗬𝗦',
                    items: [
                        { label: '📝 𝗪𝗼𝗿𝗱𝘀', value: words },
                        { label: '📄 𝗖𝗵𝗮𝗿𝗮𝗰𝘁𝗲𝗿𝘀', value: chars },
                        { label: '🔤 𝗡𝗼 𝗦𝗽𝗮𝗰𝗲𝘀', value: noSpace }
                    ]
                }
            ];
            return design.buildInfo('𝗧𝗘𝗫𝗧 𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝘀', infoSections);
        },

        sticker: '⏳ *Creating Sticker...*\n*Please wait...*',
        imageConverted: '✅ *Sticker Converted To Image*'
    }
};

module.exports = { templates, design };