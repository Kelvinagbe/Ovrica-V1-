// utils/energy-system.js - Energy Management with LowDB

const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, '../src/db2/energy.json');
const adapter = new JSONFile(dbPath);
const db = new Low(adapter);

// Initialize database structure
async function initEnergyDB() {
    await db.read();
    db.data ||= { users: [] };
    await db.write();
}

// Get user energy data
async function getUser(userId) {
    await db.read();
    return db.data.users.find(u => u.id === userId);
}

// Create new user
async function createUser(userId, initialEnergy = 100) {
    await db.read();
    
    const exists = db.data.users.find(u => u.id === userId);
    if (exists) return exists;
    
    const newUser = {
        id: userId,
        energy: initialEnergy,
        maxEnergy: 100,
        lastClaim: null,
        createdAt: Date.now()
    };
    
    db.data.users.push(newUser);
    await db.write();
    
    return newUser;
}

// Get energy amount
async function getEnergy(userId) {
    const user = await getUser(userId);
    
    if (!user) {
        const newUser = await createUser(userId);
        return newUser.energy;
    }
    
    return user.energy;
}

// Add energy
async function addEnergy(userId, amount) {
    await db.read();
    
    let user = db.data.users.find(u => u.id === userId);
    
    if (!user) {
        user = await createUser(userId);
        await db.read(); // Re-read after creation
        user = db.data.users.find(u => u.id === userId);
    }
    
    user.energy = Math.min(user.energy + amount, user.maxEnergy);
    await db.write();
    
    return user.energy;
}

// Remove energy
async function removeEnergy(userId, amount) {
    await db.read();
    
    let user = db.data.users.find(u => u.id === userId);
    
    if (!user) {
        user = await createUser(userId);
        await db.read();
        user = db.data.users.find(u => u.id === userId);
    }
    
    user.energy = Math.max(user.energy - amount, 0);
    await db.write();
    
    return user.energy;
}

// Set energy (absolute value)
async function setEnergy(userId, amount) {
    await db.read();
    
    let user = db.data.users.find(u => u.id === userId);
    
    if (!user) {
        user = await createUser(userId);
        await db.read();
        user = db.data.users.find(u => u.id === userId);
    }
    
    user.energy = Math.min(Math.max(amount, 0), user.maxEnergy);
    await db.write();
    
    return user.energy;
}

// Check if user exists
async function userExists(userId) {
    await db.read();
    return db.data.users.some(u => u.id === userId);
}

// Check daily claim availability
async function canClaimDaily(userId) {
    const user = await getUser(userId);
    
    if (!user || !user.lastClaim) return true;
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    return (now - user.lastClaim) >= dayInMs;
}

// Claim daily reward
async function claimDaily(userId, reward = 50) {
    if (!(await canClaimDaily(userId))) {
        return { success: false, message: 'Already claimed today' };
    }
    
    await db.read();
    
    let user = db.data.users.find(u => u.id === userId);
    
    if (!user) {
        user = await createUser(userId);
        await db.read();
        user = db.data.users.find(u => u.id === userId);
    }
    
    user.energy = Math.min(user.energy + reward, user.maxEnergy);
    user.lastClaim = Date.now();
    
    await db.write();
    
    return { 
        success: true, 
        energy: user.energy,
        reward: reward
    };
}

// Get time until next claim
async function getNextClaimTime(userId) {
    const user = await getUser(userId);
    
    if (!user || !user.lastClaim) return 0;
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const timePassed = now - user.lastClaim;
    
    return Math.max(0, dayInMs - timePassed);
}

// Get leaderboard
async function getLeaderboard(limit = 10) {
    await db.read();
    
    return db.data.users
        .sort((a, b) => b.energy - a.energy)
        .slice(0, limit)
        .map((user, index) => ({
            rank: index + 1,
            id: user.id,
            energy: user.energy
        }));
}

// Reset all users (admin function)
async function resetAllEnergy() {
    await db.read();
    
    db.data.users.forEach(user => {
        user.energy = 100;
        user.lastClaim = null;
    });
    
    await db.write();
}

// Get statistics
async function getStats() {
    await db.read();
    
    const users = db.data.users;
    const totalUsers = users.length;
    const totalEnergy = users.reduce((sum, u) => sum + u.energy, 0);
    const avgEnergy = totalUsers > 0 ? Math.floor(totalEnergy / totalUsers) : 0;
    
    return {
        totalUsers,
        totalEnergy,
        avgEnergy,
        maxEnergy: Math.max(...users.map(u => u.energy), 0),
        minEnergy: Math.min(...users.map(u => u.energy), 100)
    };
}

// Export all functions
module.exports = {
    initEnergyDB,
    getEnergy,
    addEnergy,
    removeEnergy,
    setEnergy,
    userExists,
    createUser,
    canClaimDaily,
    claimDaily,
    getNextClaimTime,
    getLeaderboard,
    resetAllEnergy,
    getStats
};