// commands/chatai.js - Toggle AI chat mode

const chatAI = require('../src/db/chatAI');

module.exports = {
    name: 'chatai',
    admin: true,
    description: 'Toggle AI chat mode',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            const settings = chatAI.getSettings();
            const action = args[0]?.toLowerCase();

            if (!action) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ AI CHAT ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 🤖 *AI Chat Mode*\n` +
                        `├◆ 📊 *Status:* ${settings.enabled ? '✅ ON' : '❌ OFF'}\n` +
                        `├◆ 💬 *Messages:* ${settings.messageCount}\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW IT WORKS⌟* ◆\n` +
                        `│\n` +
                        `├◆ 💬 *In Private Chats (DM):*\n` +
                        `├◆    Bot responds to ALL messages\n` +
                        `│\n` +
                        `├◆ 👥 *In Groups:*\n` +
                        `├◆    Bot responds ONLY when you\n` +
                        `├◆    REPLY to bot's message\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜COMMANDS⌟* ◆\n` +
                        `│\n` +
                        `├◆ 🟢 *Enable:* /chatai on\n` +
                        `├◆ 🔴 *Disable:* /chatai off\n` +
                        `├◆ 🗑️ *Clear history:* /chatai clear\n` +
                        `├◆ 📊 *Status:* /chatai status\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n` +
                        `│\n` +
                        `├◆ 💬 *Private Chat:*\n` +
                        `├◆    Just message: "Hey what's up?"\n` +
                        `├◆    Bot replies automatically\n` +
                        `│\n` +
                        `├◆ 👥 *In Group:*\n` +
                        `├◆    1. Bot sends a message\n` +
                        `├◆    2. You REPLY to it\n` +
                        `├◆    3. Bot responds to your reply\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜FEATURES⌟* ◆\n` +
                        `│\n` +
                        `├◆ • Chats like a real person\n` +
                        `├◆ • Remembers conversation context\n` +
                        `├◆ • Natural, friendly responses\n` +
                        `├◆ • No spam in groups\n` +
                        `│\n` +
                        `├◆ 🔧 *Powered by:* Groq AI (Llama 3.3)\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: "🤖 AI Chat",
                            body: "Chat naturally with AI",
                            thumbnailUrl: "https://i.ibb.co/0FksjQz/icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            if (action === 'on') {
                chatAI.updateSettings({ enabled: true });

                await sock.sendMessage(from, {
                    text: `✅ *AI Chat Mode Enabled!*\n\n` +
                        `🤖 I'll now chat naturally like a human\n\n` +
                        `📍 *How it works:*\n` +
                        `💬 *Private Chat:* I respond to ALL messages\n` +
                        `👥 *Groups:* I respond ONLY when you REPLY to my message\n\n` +
                        `🧠 I'll remember our conversation\n` +
                        `🎯 No spam - clean group chats!\n\n` +
                        `*Try in DM:* "Hey, how's it going?"\n` +
                        `*Try in Group:* Reply to any of my messages!`
                }, { quoted: msg });

                console.log('🤖 AI Chat mode ENABLED');
                return;
            }

            if (action === 'off') {
                chatAI.updateSettings({ enabled: false });

                await sock.sendMessage(from, {
                    text: `❌ *AI Chat Mode Disabled*\n\n` +
                        `📝 Back to command mode\n` +
                        `💬 Total messages: ${settings.messageCount}\n\n` +
                        `💡 Use /chatai on to enable again`
                }, { quoted: msg });

                console.log('🤖 AI Chat mode DISABLED');
                return;
            }

            if (action === 'clear') {
                const userId = from.split('@')[0];
                chatAI.clearHistory(from);

                await sock.sendMessage(from, {
                    text: `🗑️ *Conversation history cleared!*\n\n` +
                        `🆕 Starting fresh conversation\n` +
                        `💬 I won't remember previous messages`
                }, { quoted: msg });

                console.log(`🗑️ Cleared history for ${userId}`);
                return;
            }

            if (action === 'status') {
                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ AI CHAT STATUS ⌟* ❏\n` +
                        `│\n` +
                        `├◆ 📊 *Status:* ${settings.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\n` +
                        `├◆ 💬 *Messages Processed:* ${settings.messageCount}\n` +
                        `├◆ 👥 *Active Conversations:* ${settings.conversationHistory.size}\n` +
                        `├◆ 🕐 *Bot Uptime:* ${Math.floor(process.uptime() / 60)}m\n` +
                        `├◆ 🔧 *AI Model:* Llama 3.3 70B\n` +
                        `├◆ 🚀 *Provider:* Groq (Fast & Free)\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
                return;
            }

            // Invalid action
            await sock.sendMessage(from, {
                text: `❌ Invalid action: ${action}\n\n` +
                    `Use: on, off, clear, status`
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ ChatAI command error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Error:* ${error.message}\n\n` +
                    `Please try again or contact admin.`
            }, { quoted: msg });
        }
    }
};