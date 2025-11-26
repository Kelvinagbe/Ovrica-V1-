// commands/group.js - Group management commands for OVRICA-V1

const fs = require('fs');

// Helper function to parse JIDs from text
function parseJid(text) {
    const jidPattern = /(\d+)@s\.whatsapp\.net|(\d+)@g\.us/g;
    const matches = text.match(jidPattern);
    return matches || [];
}

// Helper function to get group admins
async function getAdmins(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        return metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);
    } catch (error) {
        return [];
    }
}

// JOIN COMMAND - Join group by link
module.exports.join = {
    name: 'join',
    description: 'Bot joins a group using invite link',
    admin: false,
    ownerOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const text = args.join(' ') || msg.message?.extendedTextMessage?.text || '';
            const groupLinkPattern = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/;
            const match = text.match(groupLinkPattern);
            
            if (!match) {
                return await sendWithTyping(sock, from, '❌ Please provide a valid WhatsApp group link!');
            }
            
            const inviteCode = match[1];
            
            try {
                await sock.groupAcceptInvite(inviteCode);
                await sendWithTyping(sock, from, '✅ Successfully joined the group!');
            } catch (error) {
                await sendWithTyping(sock, from, '❌ Failed to join group. Invalid or expired link!');
            }
        } catch (error) {
            console.error('Join command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred while joining the group.');
        }
    }
};

// GROUP INFO COMMAND
module.exports.ginfo = {
    name: 'ginfo',
    description: 'Get group information from invite link',
    admin: false,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const text = args.join(' ') || msg.message?.extendedTextMessage?.text || '';
            const groupLinkPattern = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/;
            const match = text.match(groupLinkPattern);
            
            if (!match) {
                return await sendWithTyping(sock, from, '❌ Please provide a valid WhatsApp group link!');
            }
            
            const inviteCode = match[1];
            
            try {
                const groupInfo = await sock.groupGetInviteInfo(inviteCode);
                
                const creationDate = new Date(groupInfo.creation * 1000);
                const formattedDate = creationDate.toLocaleDateString();
                
                let infoText = `📋 *Group Information*\n\n`;
                infoText += `*Name:* ${groupInfo.subject}\n`;
                infoText += `*ID:* ${groupInfo.id}\n`;
                infoText += `*Owner:* wa.me/${groupInfo.owner.split('@')[0]}\n`;
                infoText += `*Created:* ${formattedDate}\n`;
                infoText += `*Participants:* ${groupInfo.size} members\n`;
                infoText += `*Muted:* ${groupInfo.announce ? 'Yes' : 'No'}\n`;
                infoText += `*Locked:* ${groupInfo.restrict ? 'Yes' : 'No'}\n`;
                
                if (groupInfo.desc) {
                    infoText += `\n*Description:*\n${groupInfo.desc}`;
                }
                
                await sendWithTyping(sock, from, infoText);
            } catch (error) {
                await sendWithTyping(sock, from, '❌ Failed to get group info. Invalid or expired link!');
            }
        } catch (error) {
            console.error('Ginfo command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred while fetching group info.');
        }
    }
};

// ACCEPT ALL JOIN REQUESTS
module.exports.acceptall = {
    name: 'acceptall',
    alias: ['acceptjoin'],
    description: 'Accept all pending join requests',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const groupAdmins = await getAdmins(sock, from);
            
            if (!groupAdmins.includes(botNumber)) {
                return await sendWithTyping(sock, from, '❌ I need to be an admin to accept join requests!');
            }
            
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const requests = await sock.groupRequestParticipantsList(from);
            
            if (!requests || requests.length === 0) {
                return await sendWithTyping(sock, from, '✅ No pending join requests!');
            }
            
            let acceptedUsers = [];
            
            for (const request of requests) {
                try {
                    await sock.groupRequestParticipantsUpdate(from, [request.jid], 'approve');
                    acceptedUsers.push(request.jid);
                } catch (error) {
                    console.error(`Failed to accept ${request.jid}:`, error);
                }
            }
            
            if (acceptedUsers.length > 0) {
                let responseText = `✅ *Accepted ${acceptedUsers.length} join requests*\n\n`;
                acceptedUsers.forEach(jid => {
                    responseText += `• @${jid.split('@')[0]}\n`;
                });
                
                await sock.sendMessage(from, {
                    text: responseText,
                    mentions: acceptedUsers
                });
            } else {
                await sendWithTyping(sock, from, '❌ Failed to accept any requests.');
            }
        } catch (error) {
            console.error('Acceptall command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred while accepting requests.');
        }
    }
};

// REJECT ALL JOIN REQUESTS
module.exports.rejectall = {
    name: 'rejectall',
    alias: ['rejectjoin'],
    description: 'Reject all pending join requests',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const groupAdmins = await getAdmins(sock, from);
            
            if (!groupAdmins.includes(botNumber)) {
                return await sendWithTyping(sock, from, '❌ I need to be an admin to reject join requests!');
            }
            
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const requests = await sock.groupRequestParticipantsList(from);
            
            if (!requests || requests.length === 0) {
                return await sendWithTyping(sock, from, '✅ No pending join requests!');
            }
            
            let rejectedUsers = [];
            
            for (const request of requests) {
                try {
                    await sock.groupRequestParticipantsUpdate(from, [request.jid], 'reject');
                    rejectedUsers.push(request.jid);
                } catch (error) {
                    console.error(`Failed to reject ${request.jid}:`, error);
                }
            }
            
            if (rejectedUsers.length > 0) {
                let responseText = `✅ *Rejected ${rejectedUsers.length} join requests*\n\n`;
                rejectedUsers.forEach(jid => {
                    responseText += `• @${jid.split('@')[0]}\n`;
                });
                
                await sock.sendMessage(from, {
                    text: responseText,
                    mentions: rejectedUsers
                });
            } else {
                await sendWithTyping(sock, from, '❌ Failed to reject any requests.');
            }
        } catch (error) {
            console.error('Rejectall command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred while rejecting requests.');
        }
    }
};

// LIST JOIN REQUESTS
module.exports.listrequest = {
    name: 'listrequest',
    alias: ['requestlist'],
    description: 'List all pending join requests',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const requests = await sock.groupRequestParticipantsList(from);
            
            if (!requests || requests.length === 0) {
                return await sendWithTyping(sock, from, '✅ No pending join requests!');
            }
            
            let responseText = `📋 *Pending Join Requests (${requests.length})*\n\n`;
            let mentions = [];
            
            requests.forEach((request, index) => {
                responseText += `${index + 1}. @${request.jid.split('@')[0]}\n`;
                mentions.push(request.jid);
            });
            
            await sock.sendMessage(from, {
                text: responseText,
                mentions: mentions
            });
        } catch (error) {
            console.error('Listrequest command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred while fetching requests.');
        }
    }
};

// SET GROUP DESCRIPTION
module.exports.setdesc = {
    name: 'setdesc',
    alias: ['setgdesc', 'gdesc'],
    description: 'Set group description',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const groupAdmins = await getAdmins(sock, from);
            
            if (!groupAdmins.includes(botNumber)) {
                return await sendWithTyping(sock, from, '❌ I need to be an admin to change group description!');
            }
            
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const description = args.join(' ');
            
            if (!description) {
                return await sendWithTyping(sock, from, '❌ Please provide a description text!');
            }
            
            await sock.groupUpdateDescription(from, description);
            await sendWithTyping(sock, from, '✅ Group description updated successfully!');
        } catch (error) {
            console.error('Setdesc command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to update group description.');
        }
    }
};

// SET GROUP NAME
module.exports.setname = {
    name: 'setname',
    alias: ['setgname', 'gname'],
    description: 'Set group name',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const groupAdmins = await getAdmins(sock, from);
            
            if (!groupAdmins.includes(botNumber)) {
                return await sendWithTyping(sock, from, '❌ I need to be an admin to change group name!');
            }
            
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const groupName = args.join(' ');
            
            if (!groupName) {
                return await sendWithTyping(sock, from, '❌ Please provide a group name!');
            }
            
            await sock.groupUpdateSubject(from, groupName);
            await sendWithTyping(sock, from, '✅ Group name updated successfully!');
        } catch (error) {
            console.error('Setname command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to update group name.');
        }
    }
};

// LEAVE GROUP
module.exports.leave = {
    name: 'leave',
    alias: ['left'],
    description: 'Bot leaves the group',
    admin: true,
    ownerOnly: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const confirmation = args[0]?.toLowerCase();
            
            if (!confirmation || !['yes', 'sure', 'ok'].includes(confirmation)) {
                return await sendWithTyping(sock, from, '⚠️ Are you sure? Use: /leave yes');
            }
            
            await sendWithTyping(sock, from, '👋 Goodbye! Leaving the group...');
            
            setTimeout(async () => {
                await sock.groupLeave(from);
            }, 2000);
        } catch (error) {
            console.error('Leave command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to leave the group.');
        }
    }
};

// SET GROUP PROFILE PICTURE
module.exports.gpp = {
    name: 'gpp',
    description: 'Set group profile picture',
    admin: true,
    groupOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const groupAdmins = await getAdmins(sock, from);
            
            if (!groupAdmins.includes(botNumber)) {
                return await sendWithTyping(sock, from, '❌ I need to be an admin to change group picture!');
            }
            
            if (!isAdmin) {
                return await sendWithTyping(sock, from, '❌ Only admins can use this command!');
            }
            
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quotedMsg?.imageMessage) {
                return await sendWithTyping(sock, from, '❌ Please reply to an image to set as group picture!');
            }
            
            const imageBuffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
            
            await sock.updateProfilePicture(from, imageBuffer);
            await sendWithTyping(sock, from, '✅ Group profile picture updated successfully!');
        } catch (error) {
            console.error('GPP command error:', error);
            await sendWithTyping(sock, from, '❌ Failed to update group profile picture.');
        }
    }
};

// COMMON PARTICIPANTS
module.exports.common = {
    name: 'common',
    description: 'Find common participants in two groups',
    admin: false,
    ownerOnly: true,
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        try {
            const jids = parseJid(args.join(' '));
            
            let group1, group2;
            
            if (jids.length > 1) {
                group1 = jids[0].includes('@g.us') ? jids[0] : from;
                group2 = jids[1].includes('@g.us') ? jids[1] : from;
            } else if (jids.length === 1) {
                group1 = from;
                group2 = jids[0].includes('@g.us') ? jids[0] : from;
            } else {
                return await sendWithTyping(sock, from, '❌ Please provide a group JID!');
            }
            
            if (group1 === group2) {
                return await sendWithTyping(sock, from, '❌ Please provide different group JIDs!');
            }
            
            const metadata1 = await sock.groupMetadata(group1);
            const metadata2 = await sock.groupMetadata(group2);
            
            const common = metadata1.participants.filter(p1 => 
                metadata2.participants.some(p2 => p2.id === p1.id)
            );
            
            if (common.length === 0) {
                return await sendWithTyping(sock, from, '✅ No common participants found!');
            }
            
            let responseText = `👥 *Common Participants*\n\n`;
            responseText += `*Group 1:* ${metadata1.subject}\n`;
            responseText += `*Group 2:* ${metadata2.subject}\n`;
            responseText += `*Common:* ${common.length} members\n\n`;
            
            const mentions = [];
            common.forEach((participant, index) => {
                responseText += `${index + 1}. @${participant.id.split('@')[0]}\n`;
                mentions.push(participant.id);
            });
            
            await sock.sendMessage(from, {
                text: responseText,
                mentions: mentions
            });
        } catch (error) {
            console.error('Common command error:', error);
            await sendWithTyping(sock, from, '❌ An error occurred while finding common participants.');
        }
    }
};