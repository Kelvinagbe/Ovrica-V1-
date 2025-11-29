const { loadJSON, saveJSON } = require('../../utils/db-loader');

module.exports = {
    name: 'setadmin',
    alias: ['addadmin', 'removeadmin'],
    owner: true,
    description: 'Manage bot administrators',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            const action = args[0]?.toLowerCase();
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // Show current admins
            if (!action) {
                const data = loadJSON('admin.json', { admins: [] });
                const adminList = data.admins.map(a => `├◆ @${a.split('@')[0]}`).join('\n');

                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ADMIN LIST ⌟* ❏\n│\n` +
                        `├◆ 👥 Total: ${data.admins.length}\n│\n` +
                        `${adminList}\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ *⌜ COMMANDS ⌟* ❏\n│\n` +
                        `├◆ /setadmin add @user\n` +
                        `├◆ /setadmin remove @user\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`,
                    mentions: data.admins
                }, { quoted: msg });
            }

            // Add admin
            if (action === 'add') {
                if (mentionedJid.length === 0) {
                    return await sock.sendMessage(from, {
                        text: `❌ Please mention a user!\n\nUsage: /setadmin add @user`
                    }, { quoted: msg });
                }

                const data = loadJSON('admin.json', { admins: [] });
                const userToAdd = mentionedJid[0];

                if (data.admins.includes(userToAdd)) {
                    return await sock.sendMessage(from, {
                        text: `⚠️ User is already an admin!`
                    }, { quoted: msg });
                }

                data.admins.push(userToAdd);
                saveJSON('admin.json', data);

                await sock.sendMessage(from, {
                    text: `✅ Admin added!\n\n👤 @${userToAdd.split('@')[0]}`,
                    mentions: [userToAdd]
                }, { quoted: msg });
            }

            // Remove admin
            if (action === 'remove' || action === 'delete') {
                if (mentionedJid.length === 0) {
                    return await sock.sendMessage(from, {
                        text: `❌ Please mention a user!\n\nUsage: /setadmin remove @user`
                    }, { quoted: msg });
                }

                const data = loadJSON('admin.json', { admins: [] });
                const userToRemove = mentionedJid[0];
                const index = data.admins.indexOf(userToRemove);

                if (index === -1) {
                    return await sock.sendMessage(from, {
                        text: `⚠️ User is not an admin!`
                    }, { quoted: msg });
                }

                data.admins.splice(index, 1);
                saveJSON('admin.json', data);

                await sock.sendMessage(from, {
                    text: `✅ Admin removed!\n\n👤 @${userToRemove.split('@')[0]}`,
                    mentions: [userToRemove]
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Setadmin error:', error);
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};
