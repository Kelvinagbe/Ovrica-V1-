// commands/autoreact.js - Toggle automatic status reactions

const statusListener = require('@/statusListener');

module.exports = {
    name: 'autoreact',
    admin: true,
    description: 'Toggle automatic status reactions',

    exec: async (sock, from, args, msg, isAdmin) => {
        console.log('🔍 AUTOREACT COMMAND RECEIVED');
        
        try {
            const settings = statusListener.getSettings();
            const action = args[0]?.toLowerCase();
            const emoji = args[1];

            // No args - show help
            if (!action) {
                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ AUTO REACT ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ❤️ *Auto Status Reactions*\n` +
                        `├◆ 📊 *Status:* ${settings.autoReact ? '✅ ON' : '❌ OFF'}\n` +
                        `├◆ 😊 *Emoji:* ${settings.reactionEmoji}\n` +
                        `├◆ 📈 *Reacted:* ${settings.reactedCount} statuses\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜COMMANDS⌟* ◆\n` +
                        `│\n` +
                        `├◆ 🟢 *Enable:* /autoreact on\n` +
                        `├◆ 🔴 *Disable:* /autoreact off\n` +
                        `├◆ 😊 *Change Emoji:* /autoreact emoji ❤️\n` +
                        `├◆ 📊 *Check:* /autoreact status\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n` +
                        `│\n` +
                        `├◆ /autoreact emoji 🔥\n` +
                        `├◆ /autoreact emoji 👍\n` +
                        `├◆ /autoreact emoji 😍\n` +
                        `├◆ /autoreact emoji 💯\n` +
                        `│\n` +
                        `├◆ ⚠️ *Note:* Works with status view\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 201
                        },
                        externalAdReply: {
                            title: "❤️ Auto React",
                            body: "Auto-react to WhatsApp statuses",
                            thumbnailUrl: "https://i.ibb.co/0FksjQz/icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
                return;
            }

            // Turn ON
            if (action === 'on') {
                statusListener.updateSettings({ 
                    autoReact: true,
                    lastToggled: new Date().toISOString()
                });

                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SUCCESS ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ✅ *Auto-react enabled*\n` +
                        `├◆ ❤️ Bot will react with: ${settings.reactionEmoji}\n` +
                        `├◆ 🕐 *Activated:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                        `│\n` +
                        `├◆ 📝 *Bot will now react to:*\n` +
                        `├◆ • All contacts' statuses\n` +
                        `├◆ • Image statuses\n` +
                        `├◆ • Video statuses\n` +
                        `├◆ • Text statuses\n` +
                        `│\n` +
                        `├◆ 💡 *Tip:* Change emoji with:\n` +
                        `├◆ /autoreact emoji [your emoji]\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });

                console.log('❤️ Auto-react ENABLED');
                return;
            }

            // Turn OFF
            if (action === 'off') {
                statusListener.updateSettings({ 
                    autoReact: false,
                    lastToggled: new Date().toISOString()
                });

                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ DISABLED ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ❌ *Auto-react disabled*\n` +
                        `├◆ 😊 Bot will stop reacting to statuses\n` +
                        `├◆ 🕐 *Deactivated:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                        `├◆ 📊 *Total reacted:* ${settings.reactedCount}\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });

                console.log('❤️ Auto-react DISABLED');
                return;
            }

            // Change emoji
            if (action === 'emoji') {
                if (!emoji) {
                    await sock.sendMessage(from, {
                        text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                            `│\n` +
                            `├◆ ❌ *Please provide an emoji*\n` +
                            `├◆ 📝 *Usage:* /autoreact emoji ❤️\n` +
                            `│\n` +
                            `├◆ 😊 *Popular options:*\n` +
                            `├◆ ❤️ 🔥 👍 😍 💯 ⚡ 🎉 👏\n` +
                            `│\n` +
                            `└ ❏\n` +
                            `> Powered by 🎭Kelvin🎭`
                    }, { quoted: msg });
                    return;
                }

                statusListener.updateSettings({ 
                    reactionEmoji: emoji
                });

                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SUCCESS ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ✅ *Reaction emoji updated*\n` +
                        `├◆ 😊 *Old:* ${settings.reactionEmoji}\n` +
                        `├◆ 😊 *New:* ${emoji}\n` +
                        `├◆ 🕐 *Changed:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                        `│\n` +
                        `├◆ 💡 Bot will now react with ${emoji}\n` +
                        `├◆ 📊 *Status:* ${settings.autoReact ? '✅ Active' : '❌ Inactive'}\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });

                console.log(`😊 Reaction emoji changed to: ${emoji}`);
                return;
            }

            // Check status
            if (action === 'status' || action === 'info') {
                const lastToggled = settings.lastToggled 
                    ? new Date(settings.lastToggled).toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
                    : 'Never';

                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ REACT INFO ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 📊 *Current Status:*\n` +
                        `├◆ • Auto React: ${settings.autoReact ? '✅ ON' : '❌ OFF'}\n` +
                        `├◆ • Auto View: ${settings.autoView ? '✅ ON' : '❌ OFF'}\n` +
                        `│\n` +
                        `├◆ 😊 *Reaction Settings:*\n` +
                        `├◆ • Emoji: ${settings.reactionEmoji}\n` +
                        `├◆ • Reacted: ${settings.reactedCount}\n` +
                        `│\n` +
                        `├◆ 📈 *Statistics:*\n` +
                        `├◆ • Viewed: ${settings.viewedCount}\n` +
                        `├◆ • Last Toggled: ${lastToggled}\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
                return;
            }

            // Invalid action
            await sock.sendMessage(from, {
                text: `❌ Invalid action: ${action}\n\n` +
                    `Use: on, off, emoji, status`
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ AutoReact error:', error);
            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Failed to process command*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};