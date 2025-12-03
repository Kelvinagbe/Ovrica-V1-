// commands.js - PERFORMANCE OPTIMIZED
require('module-alias/register');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================
// 1. Lazy template loading (only when needed)
// 2. Cached require for hot-reload
// 3. Batch file loading
// 4. Optimized typing indicators

let templates, design, getServerStatus;
let templatesLoaded = false;

function loadTemplates() {
    if (templatesLoaded) return;
    try {
        const templateModule = require('./tmp/templates');
        templates = templateModule.templates;
        design = templateModule.design;
        getServerStatus = templateModule.getServerStatus;
        templatesLoaded = true;
    } catch (error) {
        console.error('❌ Failed to load templates:', error.message);
        process.exit(1);
    }
}

// ============================================
// OPTIMIZED TYPING INDICATOR
// ============================================
let CONFIG;
let messageQueue;

async function sendWithTyping(sock, jid, content) {
    // Lazy load CONFIG
    if (!CONFIG) CONFIG = require('@/config');
    if (!messageQueue) messageQueue = require('@/index').messageQueue;

    // Fast path: No typing simulation
    if (!CONFIG.autoTyping) {
        await sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content);
        messageQueue.set(jid, Date.now());
        return;
    }

    // Optimized delay calculation
    const lastMsg = messageQueue.get(jid) || 0;
    const delay = Math.max(0, 2000 - (Date.now() - lastMsg));
    
    if (delay > 0) await new Promise(r => setTimeout(r, delay));

    // Parallel typing + delayed send
    const typingPromise = sock.sendPresenceUpdate('composing', jid);
    const delayPromise = new Promise(r => setTimeout(r, 1500));
    
    await Promise.all([typingPromise, delayPromise]);

    // Send message
    await sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content);

    // Set available status (fire and forget)
    sock.sendPresenceUpdate('available', jid).catch(() => {});
    messageQueue.set(jid, Date.now());
}

// ============================================
// OPTIMIZED COMMAND LOADER
// ============================================
const commands = {};
const commandsDir = path.join(__dirname, './cmd');
let commandsLoaded = false;
let lastLoadTime = 0;

function loadCommands(silent = false) {
    if (!fs.existsSync(commandsDir)) {
        if (!silent && !commandsLoaded) {
            console.log('⚠️  No commands folder found, using fallback commands');
        }
        return;
    }

    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    let loadedCount = 0;

    // Batch process files
    files.forEach(file => {
        try {
            const commandPath = path.join(commandsDir, file);
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);

            if (command.name && command.exec) {
                commands[command.name] = {
                    admin: command.admin || false,
                    owner: command.owner || false,
                    description: command.description || 'No description',
                    exec: async (sock, from, args, msg, isAdmin) => {
                        return command.exec(sock, from, args, msg, isAdmin, sendWithTyping);
                    }
                };
                loadedCount++;
            }
        } catch (error) {
            if (!silent && !commandsLoaded) {
                console.error(`❌ Failed to load ${file}:`, error.message);
            }
        }
    });

    if (!silent && !commandsLoaded) {
        console.log(`✅ Loaded ${loadedCount} commands`);
    }

    lastLoadTime = Date.now();
}

// ============================================
// OPTIMIZED TEMPLATE RELOAD
// ============================================
function reloadTemplates() {
    try {
        // Clear caches in batch
        const jsonFiles = [
            './tmp/json/commands.json',
            './tmp/symbols.json',
            './head.json'
        ].map(f => path.resolve(__dirname, f));

        jsonFiles.forEach(fullPath => {
            delete require.cache[fullPath];
        });

        // Clear templates cache
        delete require.cache[require.resolve('./tmp/templates')];

        // Reload
        templatesLoaded = false;
        loadTemplates();
        return true;
    } catch (error) {
        console.error('⚠️  Failed to reload templates:', error.message);
        return false;
    }
}

// ============================================
// INITIAL LOAD
// ============================================
loadCommands(false);
commandsLoaded = true;
console.log(`\n📦 Total commands loaded: ${Object.keys(commands).length}\n`);

// ============================================
// OPTIMIZED PROXY WITH COOLDOWN
// ============================================
const RELOAD_COOLDOWN = 5000; // 5 seconds

module.exports = new Proxy(commands, {
    get(target, prop) {
        // Only reload if cooldown passed
        const now = Date.now();
        if (now - lastLoadTime > RELOAD_COOLDOWN) {
            reloadTemplates();
            loadCommands(true);
        }
        return target[prop];
    }
});

// Export utilities
module.exports.sendWithTyping = sendWithTyping;
module.exports.templates = new Proxy({}, {
    get() {
        loadTemplates();
        return templates;
    }
});
module.exports.design = new Proxy({}, {
    get() {
        loadTemplates();
        return design;
    }
});
module.exports.getServerStatus = function() {
    loadTemplates();
    return getServerStatus;
};
module.exports.reloadTemplates = reloadTemplates;