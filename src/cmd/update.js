// commands/update.js - Safe Update Bot from Git

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
    name: 'update',
    admin: true,
    description: 'Update bot from Git repository',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Check if command is used in a group
            if (from.endsWith('@g.us')) {
                return await sock.sendMessage(from, {
                    text: `╔══[❏⧉ *NOT ALLOWED* ⧉❏]\n` +
                        `║\n` +
                        `║➲ ⚠️ This function is not allowed in groups\n` +
                        `║➲ 🔒 Security restriction\n` +
                        `║\n` +
                        `║➲ 💡 Please use in:\n` +
                        `║➲ • Private chat with bot\n` +
                        `║➲ • Direct message only\n` +
                        `║\n` +
                        `╚══━━━━━━━━━━━━⧉❏]\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        }
                    }
                }, { quoted: msg });
            }

            const action = args[0]?.toLowerCase();

            // Show help menu
            if (!action || !['check', 'now', 'force', 'status'].includes(action)) {
                return await sock.sendMessage(from, {
                    text: `╔══[❏⧉ *BOT UPDATE* ⧉❏]\n` +
                        `║\n` +
                        `║➲ 🔄 Update Bot System\n` +
                        `║\n` +
                        `╚══━━━━━━━━━━━━⧉❏]\n` +
                        `╔══[❏⧉ *COMMANDS* ⧉❏]\n` +
                        `║\n` +
                        `║➲ 🔍 Check Updates:\n` +
                        `║➲    /update check\n` +
                        `║➲    (Check for available updates)\n` +
                        `║\n` +
                        `║➲ ⬇️ Update Now:\n` +
                        `║➲    /update now\n` +
                        `║➲    (Pull latest changes - SAFE)\n` +
                        `║\n` +
                        `║➲ ⚡ Force Update:\n` +
                        `║➲    /update force\n` +
                        `║➲    (Force pull - USE WITH CAUTION)\n` +
                        `║\n` +
                        `║➲ 📊 Check Status:\n` +
                        `║➲    /update status\n` +
                        `║➲    (Show git status)\n` +
                        `║\n` +
                        `╚══━━━━━━━━━━━━⧉❏]\n` +
                        `╔══[❏⧉ *SAFETY INFO* ⧉❏]\n` +
                        `║\n` +
                        `║➲ ✅ SAFE FILES (Not touched):\n` +
                        `║➲ • auth_info/ (WhatsApp session)\n` +
                        `║➲ • config.js (your settings)\n` +
                        `║➲ • .env (environment vars)\n` +
                        `║➲ • logs/ (your logs)\n` +
                        `║➲ • Any files in .gitignore\n` +
                        `║\n` +
                        `║➲ 🔄 UPDATED FILES:\n` +
                        `║➲ • Commands code\n` +
                        `║➲ • Bot logic\n` +
                        `║➲ • Dependencies\n` +
                        `║\n` +
                        `║➲ ⏱️ Downtime: 2-5 seconds\n` +
                        `║➲ 🔁 Auto-restart: Yes (with PM2)\n` +
                        `║\n` +
                        `╚══━━━━━━━━━━━━⧉❏]\n` +
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
                            title: "🔄 Bot Updater",
                            body: "Safe and secure updates",
                            thumbnailUrl: "./icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });
            }

            // Check for updates
            if (action === 'check') {
                const checkMsg = await sock.sendMessage(from, {
                    text: `╔══[❏⧉ *CHECKING* ⧉❏]\n` +
                        `║\n` +
                        `║➲ 🔍 Checking for updates...\n` +
                        `║➲ ⏳ Please wait...\n` +
                        `║\n` +
                        `╚══━━━━━━━━━━━━⧉❏]`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        }
                    }
                }, { quoted: msg });

                try {
                    await execPromise('git fetch origin');
                    const { stdout: branchOut } = await execPromise('git rev-parse --abbrev-ref HEAD');
                    const branch = branchOut.trim();
                    const { stdout: statusOut } = await execPromise(`git rev-list HEAD...origin/${branch} --count`);
                    const updatesCount = parseInt(statusOut.trim());
                    const { stdout: currentCommit } = await execPromise('git rev-parse --short HEAD');
                    const { stdout: latestCommit } = await execPromise(`git rev-parse --short origin/${branch}`);

                    if (updatesCount > 0) {
                        const { stdout: commits } = await execPromise(`git log HEAD..origin/${branch} --oneline --no-decorate -5`);
                        const commitList = commits.trim().split('\n').map(c => `║➲ • ${c}`).join('\n');

                        await sock.sendMessage(from, {
                            text: `╔══[❏⧉ *UPDATES AVAILABLE* ⧉❏]\n` +
                                `║\n` +
                                `║➲ ✅ ${updatesCount} update(s) available\n` +
                                `║➲ 🌿 Branch: ${branch}\n` +
                                `║➲ 📍 Current: ${currentCommit.trim()}\n` +
                                `║➲ 📍 Latest: ${latestCommit.trim()}\n` +
                                `║\n` +
                                `╚══━━━━━━━━━━━━⧉❏]\n` +
                                `╔══[❏⧉ *RECENT CHANGES* ⧉❏]\n` +
                                `║\n` +
                                commitList + `\n` +
                                `║\n` +
                                `╚══━━━━━━━━━━━━⧉❏]\n` +
                                `╔══[❏⧉ *UPDATE NOW* ⧉❏]\n` +
                                `║\n` +
                                `║➲ 📥 Safe update: /update now\n` +
                                `║➲ ⚡ Force update: /update force\n` +
                                `║\n` +
                                `╚══━━━━━━━━━━━━⧉❏]\n` +
                                `> Powered by 🎭Kelvin🎭`,
                            edit: checkMsg.key
                        });
                    } else {
                        await sock.sendMessage(from, {
                            text: `╔══[❏⧉ *UP TO DATE* ⧉❏]\n` +
                                `║\n` +
                                `║➲ ✅ Bot is up to date\n` +
                                `║➲ 🌿 Branch: ${branch}\n` +
                                `║➲ 📍 Commit: ${currentCommit.trim()}\n` +
                                `║➲ 🕐 Checked: ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                                `║\n` +
                                `╚══━━━━━━━━━━━━⧉❏]\n` +
                                `> Powered by 🎭Kelvin🎭`,
                            edit: checkMsg.key
                        });
                    }

                } catch (error) {
                    await sock.sendMessage(from, {
                        text: `╔══[❏⧉ *ERROR* ⧉❏]\n` +
                            `║\n` +
                            `║➲ ❌ Failed to check updates\n` +
                            `║➲ 📝 Error: ${error.message}\n` +
                            `║\n` +
                            `║➲ 💡 Make sure:\n` +
                            `║➲ • Bot is in a Git repository\n` +
                            `║➲ • Git is installed\n` +
                            `║➲ • Remote is configured\n` +
                            `║\n` +
                            `╚══━━━━━━━━━━━━⧉❏]\n` +
                            `> Powered by 🎭Kelvin🎭`,
                        edit: checkMsg.key
                    });
                }
            }

            // Update now
            else if (action === 'now') {
                const updateMsg = await sock.sendMessage(from, {
                    text: `╔══[❏⧉ *UPDATING* ⧉❏]\n` +
                        `║\n` +
                        `║➲ ⬇️ Pulling latest changes...\n` +
                        `║➲ 🔒 Your data is safe\n` +
                        `║➲ ⏳ Please wait...\n` +
                        `║\n` +
                        `╚══━━━━━━━━━━━━⧉❏]`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        }
                    }
                }, { quoted: msg });

                try {
                    const { stdout: pullOut } = await execPromise('git pull origin');

                    if (pullOut.includes('Already up to date')) {
                        await sock.sendMessage(from, {
                            text: `╔══[❏⧉ *NO UPDATES* ⧉❏]\n` +
                                `║\n` +
                                `║➲ ✅ Already up to date\n` +
                                `║➲ 📝 No changes to pull\n` +
                                `║\n` +
                                `╚══━━━━━━━━━━━━⧉❏]\n` +
                                `> Powered by 🎭Kelvin🎭`,
                            edit: updateMsg.key
                        });
                    } else if (pullOut.includes('error') || pullOut.includes('conflict')) {
                        await sock.sendMessage(from, {
                            text: `╔══[❏⧉ *CONFLICT DETECTED* ⧉❏]\n` +
                                `║\n` +
                                `║➲ ⚠️ Update blocked - conflicts found\n` +
                                `║➲ 🔒 Your data is safe\n` +
                                `║\n` +
                                `║➲ 💡 Options:\n` +
                                `║➲ • Contact developer\n` +
                                `║➲ • Use /update force (risky)\n` +
                                `║\n` +
                                `╚══━━━━━━━━━━━━⧉❏]\n` +
                                `> Powered by 🎭Kelvin🎭`,
                            edit: updateMsg.key
                        });
                    } else {
                        await sock.sendMessage(from, {
                            text: `╔══[❏⧉ *UPDATE SUCCESS* ⧉❏]\n` +
                                `║\n` +
                                `║➲ ✅ Update successful\n` +
                                `║➲ 🔒 User data preserved\n` +
                                `║➲ 🔄 Restarting bot...\n` +
                                `║➲ ⏱️ Downtime: ~3-5 seconds\n` +
                                `║\n` +
                                `║➲ 📝 Updated:\n` +
                                `║➲ ${pullOut.split('\n')[0]}\n` +
                                `║\n` +
                                `╚══━━━━━━━━━━━━⧉❏]\n` +
                                `> Powered by 🎭Kelvin🎭`,
                            edit: updateMsg.key
                        });

                        console.log('🔄 Update successful, restarting bot...');
                        console.log('✅ User files (auth_info, config) are safe');

                        setTimeout(() => {
                            process.exit(0);
                        }, 2000);
                    }

                } catch (error) {
                    await sock.sendMessage(from, {
                        text: `╔══[❏⧉ *UPDATE FAILED* ⧉❏]\n` +
                            `║\n` +
                            `║➲ ❌ Update failed\n` +
                            `║➲ 🔒 No changes made - data safe\n` +
                            `║➲ 📝 Error: ${error.message}\n` +
                            `║\n` +
                            `║➲ 💡 Try:\n` +
                            `║➲ • /update status (check status)\n` +
                            `║➲ • Contact developer\n` +
                            `║\n` +
                            `╚══━━━━━━━━━━━━⧉❏]\n` +
                            `> Powered by 🎭Kelvin🎭`,
                        edit: updateMsg.key
                    });
                }
            }

            // Force update
            else if (action === 'force') {
                const forceMsg = await sock.sendMessage(from, {
                    text: `╔══[❏⧉ *FORCE UPDATE* ⧉❏]\n` +
                        `║\n` +
                        `║➲ ⚡ Force updating...\n` +
                        `║➲ ⚠️ This will discard CODE changes\n` +
                        `║➲ 🔒 User files still safe (.gitignore)\n` +
                        `║➲ ⏳ Please wait...\n` +
                        `║\n` +
                        `╚══━━━━━━━━━━━━⧉❏]`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        }
                    }
                }, { quoted: msg });

                try {
                    const { stdout: branchOut } = await execPromise('git rev-parse --abbrev-ref HEAD');
                    const branch = branchOut.trim();

                    await execPromise('git fetch origin');
                    await execPromise(`git reset --hard origin/${branch}`);
                    await execPromise('git clean -fd');

                    await sock.sendMessage(from, {
                        text: `╔══[❏⧉ *FORCE UPDATE SUCCESS* ⧉❏]\n` +
                            `║\n` +
                            `║➲ ✅ Force update successful\n` +
                            `║➲ ⚡ Code updated to latest\n` +
                            `║➲ 🔒 User data still safe\n` +
                            `║➲ 🔄 Restarting bot...\n` +
                            `║➲ ⏱️ Downtime: ~3-5 seconds\n` +
                            `║\n` +
                            `╚══━━━━━━━━━━━━⧉❏]\n` +
                            `> Powered by 🎭Kelvin🎭`,
                        edit: forceMsg.key
                    });

                    console.log('🔄 Force update successful, restarting...');
                    console.log('✅ Files in .gitignore are preserved');

                    setTimeout(() => {
                        process.exit(0);
                    }, 2000);

                } catch (error) {
                    await sock.sendMessage(from, {
                        text: `╔══[❏⧉ *FORCE UPDATE FAILED* ⧉❏]\n` +
                            `║\n` +
                            `║➲ ❌ Force update failed\n` +
                            `║➲ 📝 Error: ${error.message}\n` +
                            `║\n` +
                            `╚══━━━━━━━━━━━━⧉❏]\n` +
                            `> Powered by 🎭Kelvin🎭`,
                        edit: forceMsg.key
                    });
                }
            }

            // Show git status
            else if (action === 'status') {
                try {
                    const { stdout: branchOut } = await execPromise('git rev-parse --abbrev-ref HEAD');
                    const { stdout: commitOut } = await execPromise('git rev-parse --short HEAD');
                    const { stdout: remoteOut } = await execPromise('git config --get remote.origin.url');
                    const { stdout: statusOut } = await execPromise('git status --short');

                    const branch = branchOut.trim();
                    const commit = commitOut.trim();
                    const remote = remoteOut.trim();
                    const hasChanges = statusOut.trim().length > 0;

                    let statusText = `╔══[❏⧉ *GIT STATUS* ⧉❏]\n` +
                        `║\n` +
                        `║➲ 🌿 Branch: ${branch}\n` +
                        `║➲ 📍 Commit: ${commit}\n` +
                        `║➲ 🔗 Remote: ${remote.replace(/https?:\/\//, '')}\n` +
                        `║➲ 📝 Local Changes: ${hasChanges ? '⚠️ Yes' : '✅ None'}\n` +
                        `║\n`;

                    if (hasChanges) {
                        statusText += `║➲ 📋 Modified files:\n`;
                        statusOut.trim().split('\n').slice(0, 10).forEach(l => {
                            statusText += `║➲ • ${l}\n`;
                        });
                        statusText += `║\n`;
                    }

                    statusText += `╚══━━━━━━━━━━━━⧉❏]\n` +
                        `> Powered by 🎭Kelvin🎭`;

                    await sock.sendMessage(from, {
                        text: statusText,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363418958316196@newsletter",
                                newsletterName: "🎭 Kelvin Tech",
                                serverMessageId: 200
                            }
                        }
                    }, { quoted: msg });

                } catch (error) {
                    await sock.sendMessage(from, {
                        text: `╔══[❏⧉ *ERROR* ⧉❏]\n` +
                            `║\n` +
                            `║➲ ❌ Failed to get status\n` +
                            `║➲ 📝 Error: ${error.message}\n` +
                            `║\n` +
                            `╚══━━━━━━━━━━━━⧉❏]\n` +
                            `> Powered by 🎭Kelvin🎭`,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363418958316196@newsletter",
                                newsletterName: "🎭 Kelvin Tech",
                                serverMessageId: 200
                            }
                        }
                    }, { quoted: msg });
                }
            }

        } catch (error) {
            console.error('❌ Update command error:', error);
            await sock.sendMessage(from, {
                text: `╔══[❏⧉ *ERROR* ⧉❏]\n` +
                    `║\n` +
                    `║➲ ❌ Command failed\n` +
                    `║➲ 📝 Error: ${error.message}\n` +
                    `║\n` +
                    `╚══━━━━━━━━━━━━⧉❏]\n` +
                    `> Powered by 🎭Kelvin🎭`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363418958316196@newsletter",
                        newsletterName: "🎭 Kelvin Tech",
                        serverMessageId: 200
                    }
                }
            }, { quoted: msg });
        }
    }
};