const db = require('@/data/database');

async function getAllEnv() {
  try {
    await db.init();
    
    const allConfigs = await db.config.l();
    
    const envObj = {};
    allConfigs.forEach(config => {
      envObj[config.name] = config.value;
    });
    
    return envObj;
  } catch (error) {
    console.error('Error getting env:', error);
    return {};
  }
}

module.exports = { getAllEnv };