// commands.js - Auto-load commands from /commands folder

const fs = require('fs');

const path = require('path');

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Load templates

let templates, design;

try {

    const templateModule = require('./templates');

    templates = templateModule.templates;

    design = templateModule.design;

} catch (error) {

    console.error('❌ Failed to load templates:', error.message);

    process.exit(1);

}

// Helper function for typing indicator

async function sendWithTyping(sock, jid, content) {

    const CONFIG = require('./config');

    const messageQueue = require('./index').messageQueue;

    

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

const commandsDir = path.join(__dirname, 'commands');

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

// Initial load with logging

loadCommands(false);

commandsLoaded = true;

console.log(`\n📦 Total commands loaded: ${Object.keys(commands).length}\n`);

// Export with auto-reload support (silent reload)

module.exports = new Proxy(commands, {

    get(target, prop) {

        // Silent reload - no console spam

        try {

            delete require.cache[require.resolve('./templates')];

            const templateModule = require('./templates');

            templates = templateModule.templates;

            design = templateModule.design;

            

            // Reload commands silently

            loadCommands(true); // Silent mode

        } catch (error) {

            // Silently fail - no console spam

        }

        return target[prop];

    }

});

module.exports.sendWithTyping = sendWithTyping;