// commands/statusview.js - Toggle automatic status viewing

const statusListener = require('../statusListener');

module.exports = {
    name: 'statusview',
    admin: true,
    description: 'Toggle automatic status viewing on/off',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            const settings = statusListener.getSettings();
            const action = args[0]?.toLowerCase();

            if (!action || !['on', 'off', 'status', 'info'].includes(action)) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ STATUS VIEW ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 👁️ *Auto Status Viewer*\n` +
                        `├◆ 📊 *Status:* ${settings.autoView ? '✅ ON' : '❌ OFF'}\n` +
                        `├◆ 📈 *Viewed:* ${settings.viewedCount} statuses\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜COMMANDS⌟* ◆\n` +
                        `│\n` +
                        `├◆ 🟢 *Enable:* /statusview on\n` +
                        `├◆ 🔴 *Disable:* /statusview off\n` +
                        `├◆ 📊 *Check:* /statusview status\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜INFO⌟* ◆\n` +
                        `│\n` +
                        `├◆ When enabled, bot will:\n` +
                        `├◆ • Auto-view all contacts' statuses\n` +
                        `├◆ • Download media to mark as viewed\n` +
                        `├◆ • Your contacts will see the view\n` +
                        `├◆ • Work in real-time as statuses post\n` +
                        `│\n` +
                        `├◆ ⚠️ *Note:* Settings reset on bot restart\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "👁️ Status Viewer",
                            body: "Auto-view WhatsApp statuses",
                            thumbnailUrl: "./icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            // Handle actions
            if (action === 'on') {
                statusListener.updateSettings({ 
                    autoView: true,
                    lastToggled: new Date().toISOString()
                });

                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SUCCESS ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ✅ *Status viewing enabled*\n` +
                        `├◆ 👁️ Bot will now auto-view all statuses\n` +
                        `├◆ 🕐 *Activated:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                        `│\n` +
                        `├◆ 📝 *Bot is now watching for:*\n` +
                        `├◆ • Image statuses\n` +
                        `├◆ • Video statuses\n` +
                        `├◆ • Text statuses\n` +
                        `├◆ • All contacts' status updates\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });

                console.log('👁️ Status auto-view ENABLED');

            } else if (action === 'off') {
                statusListener.updateSettings({ 
                    autoView: false,
                    lastToggled: new Date().toISOString()
                });

                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ DISABLED ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ❌ *Status viewing disabled*\n` +
                        `├◆ 👁️ Bot will stop viewing statuses\n` +
                        `├◆ 🕐 *Deactivated:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                        `├◆ 📊 *Total viewed:* ${settings.viewedCount}\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });

                console.log('👁️ Status auto-view DISABLED');

            } else if (action === 'status' || action === 'info') {
                const lastToggled = settings.lastToggled 
                    ? new Date(settings.lastToggled).toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
                    : 'Never';

                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ STATUS INFO ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 📊 *Current Status:*\n` +
                        `├◆ • Auto View: ${settings.autoView ? '✅ ON' : '❌ OFF'}\n` +
                        `├◆ • Auto React: ${settings.autoReact ? '✅ ON' : '❌ OFF'}\n` +
                        `│\n` +
                        `├◆ 📈 *Statistics:*\n` +
                        `├◆ • Viewed: ${settings.viewedCount}\n` +
                        `├◆ • Reacted: ${settings.reactedCount}\n` +
                        `├◆ • Last Toggled: ${lastToggled}\n` +
                        `│\n` +
                        `├◆ 🎭 *Reaction Emoji:*\n` +
                        `├◆ • Current: ${settings.reactionEmoji}\n` +
                        `├◆ • Change: /autoreact emoji [emoji]\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('❌ StatusView error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to toggle status view*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};