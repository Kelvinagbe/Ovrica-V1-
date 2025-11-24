// templates.js - OVRICA-V1 Professional Message Templates
const fs = require('fs');
const path = require('path');

// Load JSON configurations
const loadJSON = (filepath) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, filepath), 'utf8'));
    } catch (error) {
        console.error(`Error loading ${filepath}:`, error.message);
        return null;
    }
};

const commandsData = loadJSON('src/tmp/json/commands.json');
const symbolsData = loadJSON('src/tmp/symbols.json');
const headData = loadJSON('src/tmp/head.json');

// Server status helper
const getServerStatus = () => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return {
        uptime: `${days}d ${hours}h ${minutes}m`,
        status: symbolsData.status.online,
        timestamp: new Date().toLocaleString(),
        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`
    };
};

// Design system
const design = {
    // Create header
    header: (title) => {
        const { header, title_start, title_end } = symbolsData.symbols;
        return `${header} ${title_start}${title}${title_end}`;
    },

    // Create footer
    footer: () => {
        return symbolsData.symbols.footer;
    },

    // Create item line
    item: (content) => {
        return `${symbolsData.symbols.item} ${content}`;
    },

    // Create separator
    separator: () => {
        return symbolsData.symbols.separator;
    },

    // Create bold text
    bold: (text) => {
        const { bold_start, bold_end } = symbolsData.symbols;
        return `${bold_start}${text}${bold_end}`;
    },

    // Create info item with bold label
    infoItem: (label, value) => {
        return design.item(`${design.bold(label)} ${value}`);
    },

    // Create command item (NOT bold)
    commandItem: (command) => {
        return design.item(command);
    },

    // Build top header with bot info
    topHeader: (botInfo = commandsData.botInfo) => {
        const status = getServerStatus();
        const fields = headData.display.topHeader.fields;
        
        let header = design.header('𝗢𝗩𝗥𝗜𝗖𝗔 𝗩𝟭');
        header += '\n' + design.infoItem(fields[0], botInfo.name);
        header += '\n' + design.infoItem(fields[1], botInfo.owner);
        header += '\n' + design.infoItem(fields[2], botInfo.version);
        header += '\n' + design.infoItem(fields[3], botInfo.prefix);
        header += '\n' + design.infoItem(fields[4], status.uptime);
        header += '\n' + design.infoItem(fields[5], status.memory);
        header += '\n' + design.footer();
        
        return header;
    },

    // Build menu from sections
    buildMenu: (sections) => {
        let menu = design.topHeader();
        
        sections.forEach(section => {
            menu += '\n\n' + design.header(section.title);
            section.commands.forEach(cmd => {
                menu += '\n' + design.commandItem(cmd);
            });
            menu += '\n' + design.footer();
        });
        
        return menu;
    },

    // Build info display
    buildInfo: (title, infoSections) => {
        let display = design.header(title);
        
        infoSections.forEach(section => {
            display += '\n' + design.separator();
            display += '\n' + design.item(design.bold('—— ' + section.title + ' ——'));
            section.items.forEach(item => {
                display += '\n' + design.infoItem(item.label, item.value);
            });
        });
        
        display += '\n' + design.footer();
        return display;
    }
};

// Template builders
const templates = {
    // Main menu
    menu: () => {
        return design.buildMenu(commandsData.menu.sections);
    },

    // Help command
    help: (isAdmin = false) => {
        const helpData = commandsData.help;
        const sections = [];

        // General info section
        const generalItems = helpData.general.map(item => 
            `${item.command} - ${design.bold(item.description)}`
        );
        sections.push({
            title: '𝗚𝗘𝗡𝗘𝗥𝗔𝗟 𝗜𝗡𝗙𝗢',
            commands: generalItems
        });

        // Group commands section
        const groupItems = helpData.group.map(item => 
            `${item.command} ${design.bold(item.usage)}`
        );
        sections.push({
            title: '𝗚𝗥𝗢𝗨𝗣 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦',
            commands: groupItems
        });

        // Admin section (if admin)
        if (isAdmin) {
            const adminItems = helpData.admin.map(item => 
                item.usage ? `${item.command} ${design.bold(item.usage)}` : item.command
            );
            sections.push({
                title: '𝗔𝗗𝗠𝗜𝗡 𝗢𝗡𝗟𝗬',
                commands: adminItems
            });
        }

        return design.buildMenu(sections);
    },

    // Bot info
    info: (uptime, memory, chats) => {
        const status = getServerStatus();
        const infoSections = [
            {
                title: '𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢',
                items: [
                    { label: '𝗦𝘁𝗮𝘁𝘂𝘀', value: symbolsData.status.online },
                    { label: '𝗣𝗹𝗮𝘁𝗳𝗼𝗿𝗺', value: 'WhatsApp Web' },
                    { label: '𝗠𝗼𝗱𝗲', value: 'Multi-Device' }
                ]
            },
            {
                title: '𝗣𝗘𝗥𝗙𝗢𝗥𝗠𝗔𝗡𝗖𝗘',
                items: [
                    { label: `${symbolsData.icons.clock} 𝗨𝗽𝘁𝗶𝗺𝗲`, value: uptime },
                    { label: `${symbolsData.icons.memory} 𝗠𝗲𝗺𝗼𝗿𝘆`, value: memory + 'MB' },
                    { label: `${symbolsData.icons.lightning} 𝗦𝘁𝗮𝗯𝗶𝗹𝗶𝘁𝘆`, value: '99.9%' }
                ]
            },
            {
                title: '𝗔𝗖𝗧𝗜𝗩𝗜𝗧𝗬',
                items: [
                    { label: `${symbolsData.icons.chat} 𝗔𝗰𝘁𝗶𝘃𝗲 𝗖𝗵𝗮𝘁𝘀`, value: chats },
                    { label: `${symbolsData.icons.gear} 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀`, value: '1000+' }
                ]
            }
        ];
        return design.buildInfo('𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡', infoSections);
    },

    // Ping response
    ping: (latency) => {
        const status = getServerStatus();
        const infoSections = [
            {
                title: '𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘 𝗧𝗘𝗦𝗧',
                items: [
                    { label: `${symbolsData.icons.lightning} 𝗟𝗮𝘁𝗲𝗻𝗰𝘆`, value: latency + 'ms' },
                    { label: `${symbolsData.icons.success} 𝗦𝘁𝗮𝘁𝘂𝘀`, value: 'Online' },
                    { label: '🔌 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻', value: 'Stable' }
                ]
            },
            {
                title: '𝗦𝗘𝗥𝗩𝗘𝗥 𝗦𝗧𝗔𝗧𝗨𝗦',
                items: [
                    { label: `${symbolsData.icons.signal} 𝗦𝘁𝗮𝘁𝘂𝘀`, value: status.status },
                    { label: `${symbolsData.icons.clock} 𝗨𝗽𝘁𝗶𝗺𝗲`, value: status.uptime },
                    { label: `${symbolsData.icons.memory} 𝗠𝗲𝗺𝗼𝗿𝘆`, value: status.memory }
                ]
            }
        ];
        return design.buildInfo('𝗣𝗢𝗡𝗚!', infoSections);
    },

    // Features display
    features: (config) => {
        const infoSections = [
            {
                title: '𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡',
                items: commandsData.features.automation.map(feature => ({
                    label: feature.name,
                    value: config[feature.key] ? symbolsData.status.active : symbolsData.status.inactive
                }))
            },
            {
                title: '𝗠𝗔𝗜𝗡 𝗙𝗘𝗔𝗧𝗨𝗥𝗘𝗦',
                items: commandsData.features.main.map(feature => ({
                    label: `${symbolsData.icons.success} ${feature.name}`,
                    value: feature.status
                }))
            }
        ];
        return design.buildInfo('𝗕𝗢𝗧 𝗙𝗘𝗔𝗧𝗨𝗥𝗘𝗦', infoSections);
    },

    // Settings display
    settings: (config) => {
        const infoSections = [
            {
                title: '𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡',
                items: commandsData.settings.automation.map(setting => ({
                    label: setting.name,
                    value: config[setting.key] ? symbolsData.status.enabled : symbolsData.status.disabled
                }))
            },
            {
                title: '𝗔𝗗𝗠𝗜𝗡 𝗖𝗢𝗡𝗧𝗥𝗢𝗟',
                items: [
                    { 
                        label: commandsData.settings.admin[0].name,
                        value: config.admins.length + ' Admins'
                    },
                    { 
                        label: commandsData.settings.admin[1].name,
                        value: commandsData.settings.admin[1].value
                    }
                ]
            }
        ];
        return design.buildInfo('𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡', infoSections);
    },

    // Error message
    error: (message) => {
        const errorData = commandsData.messages.error;
        let msg = design.header(errorData.title);
        msg += '\n' + design.item(`${symbolsData.icons.error} ${design.bold(message)}`);
        msg += '\n' + design.separator();
        msg += '\n' + design.item(`${symbolsData.icons.bulb} ${design.bold('𝗧𝗥𝗬:')}`);
        errorData.tips.forEach(tip => {
            msg += '\n' + design.item(`• ${design.bold(tip)}`);
        });
        msg += '\n' + design.footer();
        return msg;
    },

    // Admin only message
    adminOnly: () => {
        const adminData = commandsData.messages.adminOnly;
        let msg = design.header(adminData.title);
        msg += '\n' + design.item(`${symbolsData.status.restricted}`);
        msg += '\n' + design.separator();
        msg += '\n' + design.item(design.bold(adminData.message));
        msg += '\n' + design.footer();
        return msg;
    },

    // Simple text responses
    simpleText: {
        echo: (text) => {
            let msg = design.header('𝗘𝗖𝗛𝗢');
            msg += '\n' + design.item(text);
            msg += '\n' + design.footer();
            return msg;
        },

        reversed: (text) => {
            let msg = design.header('𝗥𝗘𝗩𝗘𝗥𝗦𝗘𝗗');
            msg += '\n' + design.item(text);
            msg += '\n' + design.footer();
            return msg;
        },

        count: (words, chars, noSpace) => {
            const infoSections = [
                {
                    title: '𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝗦',
                    items: [
                        { label: '📝 𝗪𝗼𝗿𝗱𝘀', value: words },
                        { label: '📄 𝗖𝗵𝗮𝗿𝗮𝗰𝘁𝗲𝗿𝘀', value: chars },
                        { label: '🔤 𝗡𝗼 𝗦𝗽𝗮𝗰𝗲𝘀', value: noSpace }
                    ]
                }
            ];
            return design.buildInfo('𝗧𝗘𝗫𝗧 𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝗦', infoSections);
        },

        sticker: commandsData.messages.sticker.creating,
        imageConverted: commandsData.messages.sticker.converted
    }
};

module.exports = { templates, design, getServerStatus };