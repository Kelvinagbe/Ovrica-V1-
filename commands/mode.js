// ============================================
// FILE 1: commands/mode.js
// Save this file in your commands folder
// ============================================

module.exports = {
    name: 'mode',
    admin: false, // Only admins can change mode
    description: 'Switch bot between public and private mode',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        const CONFIG = require('../config');
        const fs = require('fs');
        const path = require('path');
        
        if (args.length === 0) {
            // Show current mode
            const response = `┌ ❏ *⌜ BOT MODE ⌟* ❏
│
├◆ Current Mode: ${(CONFIG.botMode || 'public').toUpperCase()}
├◆ Status: ${CONFIG.botMode === 'private' ? '🔒 PRIVATE' : '🔓 PUBLIC'}
├◆ 
├◆ Usage:
├◆ /mode public - Everyone can use
├◆ /mode private - Only admins can use
├◆ 
├◆ Description:
├◆ • PUBLIC MODE
├◆   └ All users can use commands
├◆   └ Bot responds to everyone
├◆ 
├◆ • PRIVATE MODE
├◆   └ Only admins can use commands
├◆   └ Non-admins are completely ignored
├◆   └ No response given to non-admins
└ ❏

> Powered by 🎭Kelvin🎭`;
            
            return await sendWithTyping(sock, from, response);
        }
        
        const mode = args[0].toLowerCase();
        
        if (mode !== 'public' && mode !== 'private') {
            return await sendWithTyping(sock, from, '❌ Invalid mode! Use: public or private');
        }
        
        // Update config file
        try {
            const configPath = path.join(__dirname, '../config.js');
            let configContent = fs.readFileSync(configPath, 'utf8');
            
            // Check if botMode exists in config
            if (configContent.includes('botMode:')) {
                // Replace existing botMode value
                configContent = configContent.replace(
                    /botMode:\s*['"`](public|private)['"`]/,
                    `botMode: '${mode}'`
                );
            } else {
                // Add botMode after module.exports = {
                configContent = configContent.replace(
                    /module\.exports\s*=\s*{/,
                    `module.exports = {\n    botMode: '${mode}',`
                );
            }
            
            fs.writeFileSync(configPath, configContent);
            
            // Update in memory
            CONFIG.botMode = mode;
            
            const response = `┌ ❏ *⌜ MODE CHANGED ⌟* ❏
│
├◆ New Mode: ${mode.toUpperCase()}
├◆ Status: ✅ Updated Successfully
├◆ 
├◆ ${mode === 'private' ? '🔒 BOT IS NOW PRIVATE' : '🔓 BOT IS NOW PUBLIC'}
├◆ 
├◆ Effect:
├◆ ${mode === 'private' ? '• Only admins can use commands' : '• Everyone can use commands'}
├◆ ${mode === 'private' ? '• Non-admins will be ignored' : '• Bot responds to all users'}
├◆ ${mode === 'private' ? '• No response to non-admins' : '• Welcome messages enabled'}
├◆ 
├◆ Changed by: 👑 Admin
├◆ Time: ${new Date().toLocaleString()}
└ ❏

> Powered by 🎭Kelvin🎭`;
            
            await sendWithTyping(sock, from, response);
            
            console.log(`🔄 Mode changed to: ${mode.toUpperCase()}`);
            
        } catch (error) {
            await sendWithTyping(sock, from, '❌ Failed to update mode: ' + error.message);
            console.error('❌ Mode change error:', error);
        }
    }
};
