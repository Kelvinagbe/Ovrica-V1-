// FILE: src/cmd/antiswear.js
// FIXED: Undefined property access error

const fs = require('fs');
const path = require('path');

// Load antiswear data
const dataPath = path.join(__dirname, '../db/antiswear.json');
let antiswearData = {};

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
}

// Load existing data
try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    antiswearData = JSON.parse(rawData);
} catch (error) {
    console.error('❌ Error loading antiswear data:', error.message);
    antiswearData = {};
}

// Save data to file
function saveData() {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(antiswearData, null, 2));
    } catch (error) {
        console.error('❌ Error saving antiswear data:', error.message);
    }
}

// Common swear words list
const swearWords = [
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'bastard', 'cunt',
    'dick', 'pussy', 'cock', 'motherfucker', 'nigga', 'nigger',
    'faggot', 'retard', 'slut', 'whore', 'piss', 'bollocks'
];

// Check if antiswear is enabled for a group
function isEnabled(groupJid) {
    // ✅ FIX: Safely check if property exists
    if (!antiswearData || typeof antiswearData !== 'object') {
        antiswearData = {};
        return false;
    }
    
    return antiswearData[groupJid]?.enabled === true;
}

// Enable antiswear for a group
function enable(groupJid) {
    try {
        // ✅ FIX: Initialize if doesn't exist
        if (!antiswearData[groupJid]) {
            antiswearData[groupJid] = { enabled: false, warnings: {} };
        }
        
        antiswearData[groupJid].enabled = true;
        saveData();
        return true;
    } catch (error) {
        console.error('❌ Enable antiswear error:', error.message);
        return false;
    }
}

// Disable antiswear for a group
function disable(groupJid) {
    try {
        // ✅ FIX: Check existence before accessing
        if (antiswearData[groupJid]) {
            antiswearData[groupJid].enabled = false;
            saveData();
        }
        return true;
    } catch (error) {
        console.error('❌ Disable antiswear error:', error.message);
        return false;
    }
}

// Check message for swear words
function containsSwear(text) {
    if (!text || typeof text !== 'string') return false;
    
    const lowerText = text.toLowerCase();
    return swearWords.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
    });
}

// Add warning to user
function addWarning(groupJid, userJid) {
    try {
        // ✅ FIX: Initialize group data if doesn't exist
        if (!antiswearData[groupJid]) {
            antiswearData[groupJid] = { enabled: false, warnings: {} };
        }
        
        // ✅ FIX: Initialize warnings object if doesn't exist
        if (!antiswearData[groupJid].warnings) {
            antiswearData[groupJid].warnings = {};
        }
        
        // ✅ FIX: Initialize user warnings if doesn't exist
        if (!antiswearData[groupJid].warnings[userJid]) {
            antiswearData[groupJid].warnings[userJid] = 0;
        }
        
        antiswearData[groupJid].warnings[userJid]++;
        saveData();
        
        return antiswearData[groupJid].warnings[userJid];
    } catch (error) {
        console.error('❌ Add warning error:', error.message);
        return 0;
    }
}

// Get user warnings
function getWarnings(groupJid, userJid) {
    try {
        // ✅ FIX: Safe property access with optional chaining
        return antiswearData[groupJid]?.warnings?.[userJid] || 0;
    } catch (error) {
        return 0;
    }
}

// Reset user warnings
function resetWarnings(groupJid, userJid) {
    try {
        // ✅ FIX: Check existence before deleting
        if (antiswearData[groupJid]?.warnings?.[userJid]) {
            delete antiswearData[groupJid].warnings[userJid];
            saveData();
        }
        return true;
    } catch (error) {
        console.error('❌ Reset warnings error:', error.message);
        return false;
    }
}

// Handle incoming messages
async function handleMessage(sock, msg) {
    try {
        const from = msg.key?.remoteJid;
        
        // Only process group messages
        if (!from || !from.endsWith('@g.us')) return;
        
        // Check if antiswear is enabled for this group
        if (!isEnabled(from)) return;
        
        // Get message text
        const text = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    msg.message?.imageMessage?.caption || 
                    msg.message?.videoMessage?.caption || 
                    '';
        
        if (!text) return;
        
        // Check for swear words
        if (containsSwear(text)) {
            const sender = msg.key.participant || from;
            
            // Delete the message
            try {
                await sock.sendMessage(from, { delete: msg.key });
            } catch (error) {
                console.error('❌ Failed to delete message:', error.message);
            }
            
            // Add warning
            const warnings = addWarning(from, sender);
            
            // Send warning message
            const warningMsg = `⚠️ *ANTISWEAR WARNING*\n\n` +
                             `@${sender.split('@')[0]} - Warning ${warnings}/3\n` +
                             `Reason: Inappropriate language\n\n` +
                             `${warnings >= 3 ? '❌ Maximum warnings reached!' : ''}`;
            
            await sock.sendMessage(from, {
                text: warningMsg,
                mentions: [sender]
            });
            
            // Kick user if 3 warnings
            if (warnings >= 3) {
                try {
                    await sock.groupParticipantsUpdate(from, [sender], 'remove');
                    console.log(`✅ Kicked ${sender} for swearing (3 warnings)`);
                    resetWarnings(from, sender);
                } catch (error) {
                    console.error('❌ Failed to kick user:', error.message);
                }
            }
        }
        
    } catch (error) {
        // ✅ FIX: Silent error handling - don't crash the bot
        console.error('❌ Antiswear handler error:', error.message);
    }
}

module.exports = {
    handleMessage,
    enable,
    disable,
    isEnabled,
    getWarnings,
    resetWarnings,
    addWarning
};