const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const execAsync = promisify(exec);

module.exports = {
    name: 'vchg',
    admin: false,
    description: 'Change voice effects',
 
    exec: async (sock, from, args, msg, isAdmin) => {
        let inputPath, outputPath;
        
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const audioMsg = msg.message?.audioMessage || quotedMsg?.audioMessage;

            if (!audioMsg) {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ VOICE CHANGER ⌟* ❏\n│\n` +
                        `├◆ 🎭 *Change voice effects*\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜HOW TO USE⌟* ◆\n│\n` +
                        `├◆ Reply to voice note:\n` +
                        `├◆ /voicechange [effect]\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EFFECTS⌟* ◆\n│\n` +
                        `├◆ robot - Robot voice\n` +
                        `├◆ chipmunk - High pitch\n` +
                        `├◆ deep - Deep voice\n` +
                        `├◆ echo - Echo effect\n` +
                        `├◆ reverse - Reverse audio\n` +
                        `├◆ fast - Speed up 2x\n` +
                        `├◆ slow - Slow down 0.5x\n` +
                        `├◆ nightcore - Nightcore style\n` +
                        `├◆ demon - Demonic voice\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /voicechange robot\n` +
                        `├◆ /voicechange chipmunk\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            const effect = args[0]?.toLowerCase() || 'robot';
            const validEffects = ['robot', 'chipmunk', 'deep', 'echo', 'reverse', 'fast', 'slow', 'nightcore', 'demon'];

            if (!validEffects.includes(effect)) {
                return await sock.sendMessage(from, {
                    text: `❌ *Invalid effect!*\n\n✅ Available:\n${validEffects.join(', ')}`
                }, { quoted: msg });
            }

            const processingMsg = await sock.sendMessage(from, {
                text: `🎭 *Processing ${effect} effect...*\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Create temp directory
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            inputPath = path.join(tempDir, `input_${timestamp}.ogg`);
            outputPath = path.join(tempDir, `output_${timestamp}.mp3`);

            console.log('📥 Downloading audio...');
            
            // Download audio
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            const chunks = [];
            
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            
            const buffer = Buffer.concat(chunks);
            console.log(`✅ Downloaded ${buffer.length} bytes`);

            if (buffer.length === 0) {
                throw new Error('Audio file is empty');
            }

            fs.writeFileSync(inputPath, buffer);

            // Apply effect using direct FFmpeg command
            console.log('🎨 Applying effect...');
            await applyEffect(inputPath, outputPath, effect);
            console.log('✅ Effect applied');

            // Check output
            if (!fs.existsSync(outputPath)) {
                throw new Error('Failed to create output file');
            }

            const outputBuffer = fs.readFileSync(outputPath);
            const fileSizeMB = (outputBuffer.length / (1024 * 1024)).toFixed(2);

            // Send audio
            await sock.sendMessage(from, {
                audio: outputBuffer,
                mimetype: 'audio/mpeg',
                ptt: true
            });

            await sock.sendMessage(from, {
                text: `✅ *Voice effect applied!*\n\n🎭 Effect: ${effect}\n📦 Size: ${fileSizeMB} MB`,
                edit: processingMsg.key
            });

        } catch (error) {
            console.error('❌ Error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Failed!*\n\n📝 ${error.message}\n\n💡 Make sure FFmpeg is installed!`
            }, { quoted: msg });
            
        } finally {
            // Cleanup
            try {
                if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (e) {
                console.error('Cleanup error:', e);
            }
        }
    }
};

// Apply effects using FFmpeg CLI
async function applyEffect(inputPath, outputPath, effect) {
    const effects = {
        robot: '-af "afftdn=nf=-20,aecho=0.8:0.9:1000:0.3"',
        chipmunk: '-af "asetrate=44100*1.5,aresample=44100"',
        deep: '-af "asetrate=44100*0.75,aresample=44100"',
        echo: '-af "aecho=0.8:0.88:60:0.4"',
        reverse: '-af "areverse"',
        fast: '-af "atempo=2.0"',
        slow: '-af "atempo=0.5"',
        nightcore: '-af "asetrate=44100*1.25,aresample=44100,bass=g=5"',
        demon: '-af "asetrate=44100*0.65,aresample=44100,aecho=0.8:0.9:1000:0.3"'
    };

    const filter = effects[effect] || '';
    
    // Build FFmpeg command
    const command = `ffmpeg -i "${inputPath}" ${filter} -ar 44100 -ac 2 -b:a 128k -y "${outputPath}"`;
    
    console.log('Running:', command);
    
    try {
        const { stdout, stderr } = await execAsync(command, { 
            timeout: 60000,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        
        if (stderr && !stderr.includes('Conversion successful')) {
            console.log('FFmpeg stderr:', stderr);
        }
        
        return true;
    } catch (error) {
        console.error('FFmpeg error:', error.message);
        throw new Error(`Audio processing failed: ${error.message}`);
    }
}