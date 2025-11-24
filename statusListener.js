
// statusListener.js - Status viewing and reaction handler

const settings = {
    autoView: false,
    autoReact: false,
    reactionEmoji: '❤️',
    viewedCount: 0,
    reactedCount: 0,
    lastToggled: null
};

module.exports = {
    getSettings: () => settings,
    
    updateSettings: (newSettings) => {
        Object.assign(settings, newSettings);
        console.log('📝 Settings updated:', settings);
        return settings;
    },
    
    initializeStatusListener: (sock) => {
        console.log('👁️ Status listener initialized');
        
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const msg of messages) {
                try {
                    const isStatus = msg.key.remoteJid === 'status@broadcast';
                    
                    if (!isStatus) continue;

                    console.log('📱 Status detected from:', msg.pushName || 'Unknown');
                    console.log('   • Auto View:', settings.autoView);
                    console.log('   • Auto React:', settings.autoReact);
                    
                    // AUTO VIEW
                    if (settings.autoView) {
                        const msgType = Object.keys(msg.message || {})[0];
                        console.log('   • Message Type:', msgType);
                        
                        if (['imageMessage', 'videoMessage'].includes(msgType)) {
                            try {
                                await sock.downloadMediaMessage(msg);
                                console.log('   ✅ Media downloaded (viewed)');
                            } catch (err) {
                                console.log('   ⚠️ Media download failed:', err.message);
                            }
                        }
                        
                        settings.viewedCount++;
                        console.log(`👁️ Viewed status from ${msg.pushName || 'Unknown'} (Total: ${settings.viewedCount})`);
                    }

                    // AUTO REACT - Fixed version
                    if (settings.autoReact) {
                        console.log('   • Attempting to react with:', settings.reactionEmoji);
                        
                        try {
                            // Get the participant (original poster of status)
                            const participant = msg.key.participant || msg.participant || msg.key.remoteJid;
                            
                            console.log('   • Participant:', participant);
                            
                            // Send reaction
                            const reactionMessage = {
                                react: {
                                    text: settings.reactionEmoji,
                                    key: msg.key
                                }
                            };

                            await sock.sendMessage('status@broadcast', reactionMessage, {
                                statusJidList: [participant]
                            });
                            
                            settings.reactedCount++;
                            console.log(`❤️ Reacted to status from ${msg.pushName || 'Unknown'} with ${settings.reactionEmoji} (Total: ${settings.reactedCount})`);
                        } catch (reactError) {
                            console.error('   ❌ React failed:', reactError.message);
                            
                            // Try alternative method
                            try {
                                await sock.sendMessage(msg.key.remoteJid, {
                                    react: {
                                        text: settings.reactionEmoji,
                                        key: msg.key
                                    }
                                });
                                settings.reactedCount++;
                                console.log(`❤️ Reacted (alt method) to status from ${msg.pushName || 'Unknown'}`);
                            } catch (altError) {
                                console.error('   ❌ Alt react method also failed:', altError.message);
                            }
                        }
                    }

                } catch (error) {
                    console.error('❌ Status handling error:', error.message);
                    if (error.stack) {
                        console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
                    }
                }
            }
        });
    }
};