// setup.js - First Time Setup Script

const fs = require('fs');

const path = require('path');

const { execSync } = require('child_process');

console.log('🚀 Starting WhatsApp Bot Setup...\n');

// Step 1: Create necessary directories

const directories = ['logs', 'auth_info', 'commands'];

console.log('📁 Creating directories...');

directories.forEach(dir => {

  const dirPath = path.join(__dirname, dir);

  if (!fs.existsSync(dirPath)) {

    fs.mkdirSync(dirPath, { recursive: true });

    console.log(`   ✅ Created ${dir}/`);

  } else {

    console.log(`   ⏭️  ${dir}/ already exists`);

  }

});

// Step 2: Create .gitignore if it doesn't exist

console.log('\n📝 Checking .gitignore...');

const gitignorePath = path.join(__dirname, '.gitignore');

const gitignoreContent = `# Dependencies

node_modules/

package-lock.json

# Environment variables

.env

.env.local

# Bot authentication data (IMPORTANT - keeps your WhatsApp session)

auth_info/

*.data.json

# Logs

logs/

*.log

# OS files

.DS_Store

Thumbs.db

# IDE files

.vscode/

.idea/

*.swp

*.swo

# PM2 files

.pm2/

# User config (if you create one)

config.local.js

`;

if (!fs.existsSync(gitignorePath)) {

  fs.writeFileSync(gitignorePath, gitignoreContent);

  console.log('   ✅ Created .gitignore');

} else {

  console.log('   ⏭️  .gitignore already exists');

}

// Step 3: Check if PM2 is installed

console.log('\n🔍 Checking PM2 installation...');

try {

  execSync('pm2 --version', { stdio: 'pipe' });

  console.log('   ✅ PM2 is installed');

} catch (error) {

  console.log('   ⚠️  PM2 not found');

  console.log('   Installing PM2 globally...');

  try {

    execSync('npm install -g pm2', { stdio: 'inherit' });

    console.log('   ✅ PM2 installed successfully');

  } catch (installError) {

    console.log('   ❌ Failed to install PM2 automatically');

    console.log('   Please run: npm install -g pm2');

  }

}

// Step 4: Check Git configuration

console.log('\n🔧 Checking Git configuration...');

try {

  const remote = execSync('git config --get remote.origin.url', { 

    stdio: 'pipe',

    encoding: 'utf-8' 

  }).trim();

  console.log(`   ✅ Git remote configured: ${remote}`);

} catch (error) {

  console.log('   ⚠️  Git remote not configured');

  console.log('   Note: Auto-update feature requires Git repository');

}

// Step 5: Create sample config if needed

console.log('\n⚙️  Checking configuration...');

const configPath = path.join(__dirname, 'config.js');

if (!fs.existsSync(configPath)) {

  const sampleConfig = `// config.js - Bot Configuration

module.exports = {

  // Bot Settings

  botName: 'WhatsApp Bot',

  prefix: '/',

  

  // Admin Settings (WhatsApp numbers without +)

  admins: [

    '1234567890' // Replace with your number

  ],

  

  // Feature Toggles

  features: {

    autoUpdate: true,

    logging: true,

    autoRead: false

  },

  

  // Update Settings

  update: {

    checkOnStart: true,

    autoInstallDeps: true

  }

};

`;

  fs.writeFileSync(configPath, sampleConfig);

  console.log('   ✅ Created sample config.js');

  console.log('   ⚠️  Please edit config.js and add your admin number!');

} else {

  console.log('   ⏭️  config.js already exists');

}

// Step 6: Install dependencies

console.log('\n📦 Installing dependencies...');

try {

  console.log('   This may take a minute...');

  execSync('npm install', { stdio: 'inherit' });

  console.log('   ✅ Dependencies installed');

} catch (error) {

  console.log('   ❌ Failed to install dependencies');

  console.log('   Please run: npm install');

}

// Final instructions

console.log('\n' + '='.repeat(50));

console.log('✨ Setup Complete! ✨');

console.log('='.repeat(50));

console.log('\n📋 Next Steps:\n');

console.log('1. Edit config.js and add your admin WhatsApp number');

console.log('2. Make sure your update.js command is in commands/ folder');

console.log('3. Start the bot:\n');

console.log('   Development mode:');

console.log('   npm start\n');

console.log('   Production mode (PM2):');

console.log('   npm run pm2:setup\n');

console.log('4. Scan the QR code with WhatsApp\n');

console.log('📚 Useful Commands:\n');

console.log('   npm run pm2:logs      - View logs');

console.log('   npm run pm2:status    - Check status');

console.log('   npm run pm2:restart   - Restart bot');

console.log('   npm run pm2:stop      - Stop bot\n');

console.log('🔄 Update Commands (in WhatsApp):\n');

console.log('   /update check   - Check for updates');

console.log('   /update now     - Update bot safely');

console.log('   /update status  - Show Git status\n');

console.log('='.repeat(50));

console.log('\n🎭 Bot by Kelvin 🎭\n');