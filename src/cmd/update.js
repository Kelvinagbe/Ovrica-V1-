const { exec } = require('child_process');
const util = require('util');
const { templates, design } = require('../tmp/templates');
const execPromise = util.promisify(exec);

module.exports = {
    name: 'update',
    admin: true,
    description: 'Update bot from Git repository',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Check if command is used in a group
            if (from.endsWith('@g.us')) {
                const notAllowedMsg = design.header('NOT ALLOWED');
                let text = notAllowedMsg + '\n';
                text += design.separator() + '\n';
                text += design.item('⚠️ ' + design.bold('This function is not allowed in groups')) + '\n';
                text += design.item('🔒 ' + design.bold('Security restriction')) + '\n';
                text += design.separator() + '\n';
                text += design.item('💡 ' + design.bold('Please use in:')) + '\n';
                text += design.item('• Private chat with bot') + '\n';
                text += design.item('• Direct message only') + '\n';
                text += design.footer() + '\n';
                text += '> Powered by 🎭Kelvin🎭';

                return await sock.sendMessage(from, {
                    text,
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
                let helpText = design.header('BOT UPDATE') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('🔄 ' + design.bold('Update Bot System')) + '\n';
                helpText += design.footer() + '\n\n';
                
                helpText += design.header('COMMANDS') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('🔍 ' + design.bold('Check Updates:')) + '\n';
                helpText += design.item('   /update check') + '\n';
                helpText += design.item('   (Check for available updates)') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('⬇️ ' + design.bold('Update Now:')) + '\n';
                helpText += design.item('   /update now') + '\n';
                helpText += design.item('   (Pull latest changes - SAFE)') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('⚡ ' + design.bold('Force Update:')) + '\n';
                helpText += design.item('   /update force') + '\n';
                helpText += design.item('   (Force pull - USE WITH CAUTION)') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('📊 ' + design.bold('Check Status:')) + '\n';
                helpText += design.item('   /update status') + '\n';
                helpText += design.item('   (Show git status)') + '\n';
                helpText += design.footer() + '\n\n';
                
                helpText += design.header('SAFETY INFO') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('✅ ' + design.bold('SAFE FILES (Not touched):')) + '\n';
                helpText += design.item('• auth_info/ (WhatsApp session)') + '\n';
                helpText += design.item('• config.js (your settings)') + '\n';
                helpText += design.item('• .env (environment vars)') + '\n';
                helpText += design.item('• logs/ (your logs)') + '\n';
                helpText += design.item('• Any files in .gitignore') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('🔄 ' + design.bold('UPDATED FILES:')) + '\n';
                helpText += design.item('• Commands code') + '\n';
                helpText += design.item('• Bot logic') + '\n';
                helpText += design.item('• Dependencies') + '\n';
                helpText += design.separator() + '\n';
                helpText += design.item('⏱️ ' + design.bold('Downtime:') + ' 2-5 seconds') + '\n';
                helpText += design.item('🔁 ' + design.bold('Auto-restart:') + ' Yes (with PM2)') + '\n';
                helpText += design.footer() + '\n';
                helpText += '> Powered by 🎭Kelvin🎭';

                return await sock.sendMessage(from, {
                    text: helpText,
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
                let checkText = design.header('CHECKING') + '\n';
                checkText += design.separator() + '\n';
                checkText += design.item('🔍 ' + design.bold('Checking for updates...')) + '\n';
                checkText += design.item('⏳ Please wait...') + '\n';
                checkText += design.footer();

                const checkMsg = await sock.sendMessage(from, {
                    text: checkText,
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
                        const commitList = commits.trim().split('\n').map(c => design.item(`• ${c}`)).join('\n');

                        let updateAvailText = design.header('UPDATES AVAILABLE') + '\n';
                        updateAvailText += design.separator() + '\n';
                        updateAvailText += design.item(`✅ ${design.bold(updatesCount + ' update(s) available')}`) + '\n';
                        updateAvailText += design.item(`🌿 ${design.bold('Branch:')} ${branch}`) + '\n';
                        updateAvailText += design.item(`📍 ${design.bold('Current:')} ${currentCommit.trim()}`) + '\n';
                        updateAvailText += design.item(`📍 ${design.bold('Latest:')} ${latestCommit.trim()}`) + '\n';
                        updateAvailText += design.footer() + '\n\n';
                        updateAvailText += design.header('RECENT CHANGES') + '\n';
                        updateAvailText += design.separator() + '\n';
                        updateAvailText += commitList + '\n';
                        updateAvailText += design.footer() + '\n\n';
                        updateAvailText += design.header('UPDATE NOW') + '\n';
                        updateAvailText += design.separator() + '\n';
                        updateAvailText += design.item('📥 Safe update: /update now') + '\n';
                        updateAvailText += design.item('⚡ Force update: /update force') + '\n';
                        updateAvailText += design.footer() + '\n';
                        updateAvailText += '> Powered by 🎭Kelvin🎭';

                        await sock.sendMessage(from, { text: updateAvailText, edit: checkMsg.key });
                    } else {
                        let upToDateText = design.header('UP TO DATE') + '\n';
                        upToDateText += design.separator() + '\n';
                        upToDateText += design.item(`✅ ${design.bold('Bot is up to date')}`) + '\n';
                        upToDateText += design.item(`🌿 ${design.bold('Branch:')} ${branch}`) + '\n';
                        upToDateText += design.item(`📍 ${design.bold('Commit:')} ${currentCommit.trim()}`) + '\n';
                        upToDateText += design.item(`🕐 ${design.bold('Checked:')} ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}`) + '\n';
                        upToDateText += design.footer() + '\n';
                        upToDateText += '> Powered by 🎭Kelvin🎭';

                        await sock.sendMessage(from, { text: upToDateText, edit: checkMsg.key });
                    }
                } catch (error) {
                    const errorText = templates.error(`Failed to check updates: ${error.message}\n\nMake sure:\n• Bot is in a Git repository\n• Git is installed\n• Remote is configured`);
                    await sock.sendMessage(from, { text: errorText, edit: checkMsg.key });
                }
            }

            // Update now
            else if (action === 'now') {
                let updatingText = design.header('UPDATING') + '\n';
                updatingText += design.separator() + '\n';
                updatingText += design.item('⬇️ ' + design.bold('Pulling latest changes...')) + '\n';
                updatingText += design.item('🔒 ' + design.bold('Your data is safe')) + '\n';
                updatingText += design.item('⏳ Please wait...') + '\n';
                updatingText += design.footer();

                const updateMsg = await sock.sendMessage(from, {
                    text: updatingText,
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
                        let noUpdateText = design.header('NO UPDATES') + '\n';
                        noUpdateText += design.separator() + '\n';
                        noUpdateText += design.item('✅ ' + design.bold('Already up to date')) + '\n';
                        noUpdateText += design.item('📝 No changes to pull') + '\n';
                        noUpdateText += design.footer() + '\n';
                        noUpdateText += '> Powered by 🎭Kelvin🎭';

                        await sock.sendMessage(from, { text: noUpdateText, edit: updateMsg.key });
                    } else if (pullOut.includes('error') || pullOut.includes('conflict')) {
                        const conflictText = templates.error('Update blocked - conflicts found\n\nYour data is safe\n\nOptions:\n• Contact developer\n• Use /update force (risky)');
                        await sock.sendMessage(from, { text: conflictText, edit: updateMsg.key });
                    } else {
                        let successText = design.header('UPDATE SUCCESS') + '\n';
                        successText += design.separator() + '\n';
                        successText += design.item('✅ ' + design.bold('Update successful')) + '\n';
                        successText += design.item('🔒 ' + design.bold('User data preserved')) + '\n';
                        successText += design.item('🔄 ' + design.bold('Restarting bot...')) + '\n';
                        successText += design.item('⏱️ ' + design.bold('Downtime: ~3-5 seconds')) + '\n';
                        successText += design.separator() + '\n';
                        successText += design.item('📝 ' + design.bold('Updated:')) + '\n';
                        successText += design.item(pullOut.split('\n')[0]) + '\n';
                        successText += design.footer() + '\n';
                        successText += '> Powered by 🎭Kelvin🎭';

                        await sock.sendMessage(from, { text: successText, edit: updateMsg.key });

                        console.log('🔄 Update successful, restarting bot...');
                        setTimeout(() => process.exit(0), 2000);
                    }
                } catch (error) {
                    const errorText = templates.error(`Update failed: ${error.message}\n\nNo changes made - data safe\n\nTry:\n• /update status\n• Contact developer`);
                    await sock.sendMessage(from, { text: errorText, edit: updateMsg.key });
                }
            }

            // Force update
            else if (action === 'force') {
                let forceText = design.header('FORCE UPDATE') + '\n';
                forceText += design.separator() + '\n';
                forceText += design.item('⚡ ' + design.bold('Force updating...')) + '\n';
                forceText += design.item('⚠️ ' + design.bold('This will discard CODE changes')) + '\n';
                forceText += design.item('🔒 ' + design.bold('User files still safe (.gitignore)')) + '\n';
                forceText += design.item('⏳ Please wait...') + '\n';
                forceText += design.footer();

                const forceMsg = await sock.sendMessage(from, {
                    text: forceText,
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

                    let forceSuccessText = design.header('FORCE UPDATE SUCCESS') + '\n';
                    forceSuccessText += design.separator() + '\n';
                    forceSuccessText += design.item('✅ ' + design.bold('Force update successful')) + '\n';
                    forceSuccessText += design.item('⚡ ' + design.bold('Code updated to latest')) + '\n';
                    forceSuccessText += design.item('🔒 ' + design.bold('User data still safe')) + '\n';
                    forceSuccessText += design.item('🔄 ' + design.bold('Restarting bot...')) + '\n';
                    forceSuccessText += design.item('⏱️ ' + design.bold('Downtime: ~3-5 seconds')) + '\n';
                    forceSuccessText += design.footer() + '\n';
                    forceSuccessText += '> Powered by 🎭Kelvin🎭';

                    await sock.sendMessage(from, { text: forceSuccessText, edit: forceMsg.key });

                    console.log('🔄 Force update successful, restarting...');
                    setTimeout(() => process.exit(0), 2000);
                } catch (error) {
                    const errorText = templates.error(`Force update failed: ${error.message}`);
                    await sock.sendMessage(from, { text: errorText, edit: forceMsg.key });
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

                    let statusText = design.header('GIT STATUS') + '\n';
                    statusText += design.separator() + '\n';
                    statusText += design.item(`🌿 ${design.bold('Branch:')} ${branch}`) + '\n';
                    statusText += design.item(`📍 ${design.bold('Commit:')} ${commit}`) + '\n';
                    statusText += design.item(`🔗 ${design.bold('Remote:')} ${remote.replace(/https?:\/\//, '')}`) + '\n';
                    statusText += design.item(`📝 ${design.bold('Local Changes:')} ${hasChanges ? '⚠️ Yes' : '✅ None'}`) + '\n';
                    
                    if (hasChanges) {
                        statusText += design.separator() + '\n';
                        statusText += design.item('📋 ' + design.bold('Modified files:')) + '\n';
                        statusOut.trim().split('\n').slice(0, 10).forEach(line => {
                            statusText += design.item(`• ${line}`) + '\n';
                        });
                    }
                    
                    statusText += design.footer() + '\n';
                    statusText += '> Powered by 🎭Kelvin🎭';

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
                    const errorText = templates.error(`Failed to get status: ${error.message}`);
                    await sock.sendMessage(from, { text: errorText }, { quoted: msg });
                }
            }

        } catch (error) {
            console.error('❌ Update command error:', error);
            const errorText = templates.error(`Command failed: ${error.message}`);
            await sock.sendMessage(from, { text: errorText }, { quoted: msg });
                }
            }

        } catch (error) {
            console.error('❌ Update command error:', error);
            const errorText = templates.error(`Command failed: ${error.message}`);
            await sock.sendMessage(from, { text: errorText }, { quoted: msg });
        }
    }
};