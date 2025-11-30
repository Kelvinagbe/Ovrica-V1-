const db = require('./database');

async function getAllEnv() {
  try {
    await db.init();
    
    const allConfigs = await db.config.l();
    
    console.log('All Environment Variables:');
    allConfigs.forEach(config => {
      console.log(`${config.name}: ${config.value}`);
    });
    
    await db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

getAllEnv();