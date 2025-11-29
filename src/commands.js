// commands.js - Auto-load commands from /commands folder

const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Load templates
let templates, design, getServerStatus;
try {
    const templateModule = require('@/src/tmp/templates');
    templates = templateModule.templates;
    design = templateModule.design;
    getServerStatus = templateModule.getServerStatus;
} catch (error) {
    console.error('❌ Failed to load templates:', error.message);
    process.exit(1);
}

// Helper function for typing indicator
async function sendWithTyping(sock, jid, content) {
    const CONFIG = require('@/config');
    const messageQueue = require('@/index').messageQueue;

    const delay = Math.max(0, 2000 - (Date.now() - (messageQueue.get(jid) || 0)));
    if (delay > 0) await new Promise(r => setTimeout(r, delay));

    if (CONFIG.autoTyping) {
        await sock.sendPresenceUpdate('composing', jid);
        await new Promise(r => setTimeout(r, 1500));
    }

    await sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content);

    if (CONFIG.autoTyping) await sock.sendPresenceUpdate('available', jid);
    messageQueue.set(jid, Date.now());
}

// Auto-load commands from /commands folder
const commands = {};
const commandsDir = path.join(__dirname, '@/src/cmd');
let commandsLoaded = false; // Track if we've already logged

function loadCommands(silent = false) {
    if (!fs.existsSync(commandsDir)) {
        if (!silent && !commandsLoaded) {
            console.log('⚠️  No commands folder found, using fallback commands');
        }
        return;
    }

    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

    files.forEach(file => {
        try {
            const commandPath = path.join(commandsDir, file);
            delete require.cache[require.resolve(commandPath)]; // Clear cache for hot reload
            const command = require(commandPath);

            if (command.name && command.exec) {
                commands[command.name] = {
                    admin: command.admin || false,
                    description: command.description || 'No description',
                    exec: async (sock, from, args, msg, isAdmin) => {
                        return command.exec(sock, from, args, msg, isAdmin, sendWithTyping);
                    }
                };
                // Only log on initial load
                if (!silent && !commandsLoaded) {
                    console.log(`✅ Loaded command: ${command.name}`);
                }
            }
        } catch (error) {
            if (!silent && !commandsLoaded) {
                console.error(`❌ Failed to load ${file}:`, error.message);
            }
        }
    });
}

// Reload templates function (for hot-reload)
function reloadTemplates() {
    try {
        // Clear all JSON file caches
        const jsonFiles = [
            '@/src/tmp/json/commands.json',
            '@/src/tmp/symbols.json',
            '@/src/head.json'
        ];
        
        jsonFiles.forEach(file => {
            const fullPath = path.resolve(__dirname, file);
            if (require.cache[fullPath]) {
                delete require.cache[fullPath];
            }
        });

        // Clear templates cache
        delete require.cache[require.resolve('@/src/tmp/templates')];
        
        // Reload templates
        const templateModule = require('@/templates');
        templates = templateModule.templates;
        design = templateModule.design;
        getServerStatus = templateModule.getServerStatus;
        
        return true;
    } catch (error) {
        console.error('⚠️  Failed to reload templates:', error.message);
        return false;
    }
}

// Initial load with logging
loadCommands(false);
commandsLoaded = true;
console.log(`\n📦 Total commands loaded: ${Object.keys(commands).length}\n`);

// Export with auto-reload support (optimized)
let lastReloadTime = 0;
const RELOAD_COOLDOWN = 5000; // 5 seconds cooldown

module.exports = new Proxy(commands, {
    get(target, prop) {
        // Only reload if enough time has passed (prevents excessive reloading)
        const now = Date.now();
        if (now - lastReloadTime > RELOAD_COOLDOWN) {
            reloadTemplates();
            loadCommands(true); // Silent mode
            lastReloadTime = now;
        }
        return target[prop];
    }
});

module.exports.sendWithTyping = sendWithTyping;
module.exports.templates = templates;
module.exports.design = design;
module.exports.getServerStatus = getServerStatus;
module.exports.reloadTemplates = reloadTemplates;