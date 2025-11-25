const fs = require('fs');
const path = require('path');

function loadJSON(fileName, defaultValue = {}) {
    try {
        const filePath = path.join(__dirname, '../src/db', fileName);
        
        // Create directory if needed
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Create file if doesn't exist
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${fileName}:`, error.message);
        return defaultValue;
    }
}

function saveJSON(fileName, data) {
    try {
        const filePath = path.join(__dirname, '../src/db', fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error saving ${fileName}:`, error.message);
        return false;
    }
}

module.exports = { loadJSON, saveJSON };
