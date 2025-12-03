const { getEnergy, userExists, createUser } = require('@/utils/energy-system');

module.exports = {
    name: 'energy',
    admin: false,
    description: '⚡ Check your energy',
    
    exec: async (sock, from, args, msg, isAdmin, sendWithTyping) => {
        const userId = msg.key.remoteJid;
        
        if (!(await userExists(userId))) {
            await createUser(userId);
        }
        
        const energy = await getEnergy(userId);
        
        await sendWithTyping(sock, from,
            `⚡ *Your Energy*\n\n💫 ${energy} energy`
        );
    }
};