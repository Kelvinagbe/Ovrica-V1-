// utils/energy-system.js - Fixed Energy System with Proper Initialization

const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dbDir, 'energy.json');
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, { users: [] }); // ✅ Provide default data here

// In-memory cache for faster access
const energyCache = new Map();
const CACHE_TTL = 30000; // 30 seconds cache lifetime

// Batch write system
let writeTimeout = null;
let needsWrite = false;

// Queue database write (batched for performance)
function queueWrite() {
    needsWrite = true;
    
    if (writeTimeout) return;
    
    writeTimeout = setTimeout(async () => {
        if (needsWrite) {
            await db.write();
            needsWrite = false;
        }
        writeTimeout = null;
    }, 2000); // Write every 2 seconds max
}

// Force immediate write (for critical operations)
async function forceWrite() {
    if (writeTimeout) {
        clearTimeout(writeTimeout);
        writeTimeout = null;
    }
    await db.write();
    needsWrite = false;
}

// Initialize database structure
async function initEnergyDB() {
    try {
        await db.read();
        
        // Ensure data structure exists
        db.data = db.data || { users: [] };
        
        // Write initial structure if new
        await db.write();
        
        console.log('✅ Energy system ready');
    } catch (error) {
        console.error('❌ Energy DB init failed:', error.message);
        // Set default data on error
        db.data = { users: [] };
        await db.write();
    }
}

// Get user from cache or database
async function getUser(userId) {
    const cached = energyCache.get(userId);
    
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return cached.user;
    }
    
    await db.read();
    const user = db.data.users.find(u => u.id === userId);
    
    if (user) {
        energyCache.set(userId, { user, time: Date.now() });
    }
    
    return user;
}

// Create new user with initial energy
async function createUser(userId, initialEnergy = 100) {
    await db.read();
    
    const exists = db.data.users.find(u => u.id === userId);
    if (exists) {
        energyCache.set(userId, { user: exists, time: Date.now() });
        return exists;
    }
    
    const newUser = {
        id: userId,
        energy: initialEnergy,
        createdAt: Date.now()
    };
    
    db.data.users.push(newUser);
    energyCache.set(userId, { user: newUser, time: Date.now() });
    
    queueWrite();
    
    return newUser;
}

// Check if user exists (cached)
async function userExists(userId) {
    const cached = energyCache.get(userId);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return true;
    }
    
    await db.read();
    return db.data.users.some(u => u.id === userId);
}

// Get energy amount (cached)
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
        await db.read();
        user = db.data.users.find(u => u.id === userId);
    }
    
    user.energy += amount;
    
    // Update cache
    energyCache.set(userId, { user, time: Date.now() });
    
    queueWrite();
    
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
    
    // Update cache
    energyCache.set(userId, { user, time: Date.now() });
    
    queueWrite();
    
    return user.energy;
}

// Set energy to specific amount
async function setEnergy(userId, amount) {
    await db.read();
    
    let user = db.data.users.find(u => u.id === userId);
    
    if (!user) {
        user = await createUser(userId);
        await db.read();
        user = db.data.users.find(u => u.id === userId);
    }
    
    user.energy = Math.max(amount, 0);
    
    // Update cache
    energyCache.set(userId, { user, time: Date.now() });
    
    queueWrite();
    
    return user.energy;
}

// Check if user has enough energy (fastest - cache first)
async function hasEnergy(userId, amount) {
    const currentEnergy = await getEnergy(userId);
    return currentEnergy >= amount;
}

// Get all users (bypasses cache)
async function getAllUsers() {
    await db.read();
    return db.data.users;
}

// Delete user
async function deleteUser(userId) {
    await db.read();
    
    const index = db.data.users.findIndex(u => u.id === userId);
    if (index !== -1) {
        db.data.users.splice(index, 1);
        energyCache.delete(userId);
        await forceWrite(); // Immediate write for deletion
        return true;
    }
    
    return false;
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
        maxEnergy: totalUsers > 0 ? Math.max(...users.map(u => u.energy)) : 0,
        minEnergy: totalUsers > 0 ? Math.min(...users.map(u => u.energy)) : 0,
        cacheSize: energyCache.size
    };
}

// Clear cache (useful for debugging)
function clearCache() {
    energyCache.clear();
}

// Graceful shutdown - save all pending writes
async function shutdown() {
    if (writeTimeout) {
        clearTimeout(writeTimeout);
    }
    if (needsWrite) {
        await db.write();
    }
    console.log('💾 Energy system saved');
}

// Export functions
module.exports = {
    initEnergyDB,
    userExists,
    createUser,
    getEnergy,
    addEnergy,
    removeEnergy,
    setEnergy,
    hasEnergy,
    getAllUsers,
    deleteUser,
    getStats,
    clearCache,
    shutdown,
    forceWrite
};