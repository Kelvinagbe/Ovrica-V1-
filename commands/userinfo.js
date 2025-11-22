module.exports = {
    name: 'userinfo',
    admin: false,
    description: 'Get your user information',
    
    async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
        const sender = from.endsWith('@g.us') ? msg.key.participant : from;
        const number = sender.split('@')[0];
        const userName = msg.pushName || 'User';
        const isGroup = from.endsWith('@g.us');
        
        const response = `┌ ❏ *⌜ USER INFO ⌟* ❏
│
├◆ Name: ${userName}
├◆ Number: ${number}
├◆ Chat Type: ${isGroup ? 'Group' : 'Private'}
├◆ Admin Status: ${isAdmin ? '✅ Admin' : '❌ Regular User'}
├◆ JID: ${sender}
└ ❏

> Powered by 🎭Kelvin🎭`;
        
        await sendWithTyping(sock, from, response);
    }
};