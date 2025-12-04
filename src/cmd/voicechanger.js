const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'voicechange',
    admin: false,
    description: 'Change voice effects',

    exec: async (sock, from, args, msg, isAdmin) => {
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
                        `├◆ slow - Slow down 0.5x\n│\n` +
                        `└ ❏\n` +
                        `┌ ❏ ◆ *⌜EXAMPLES⌟* ◆\n│\n` +
                        `├◆ /voicechange robot\n` +
                        `├◆ /voicechange chipmunk\n│\n` +
                        `└ ❏\n> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            const effect = args[0]?.toLowerCase() || 'robot';
            const validEffects = ['robot', 'chipmunk', 'deep', 'echo', 'reverse', 'fast', 'slow'];

            if (!validEffects.includes(effect)) {
                return await sock.sendMessage(from, {
                    text: `❌ Invalid effect!\n\n✅ Available: ${validEffects.join(', ')}`
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

            // Download audio with proper handling
            console.log('Downloading audio...');
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            console.log(`Downloaded ${buffer.length} bytes`);

            // Save input file - use .opus for WhatsApp audio
            const inputPath = path.join(tempDir, `input_${Date.now()}.opus`);
            const convertedPath = path.join(tempDir, `converted_${Date.now()}.wav`);
            const outputPath = path.join(tempDir, `output_${Date.now()}.mp3`);
            
            fs.writeFileSync(inputPath, buffer);

            // Step 1: Convert to WAV first (ensures compatibility)
            await convertToWav(inputPath, convertedPath);
            console.log('Converted to WAV');

            // Step 2: Apply effect
            await applyVoiceEffect(convertedPath, outputPath, effect);
            console.log('Applied effect');

            // Step 3: Read and send
            const audioBuffer = fs.readFileSync(outputPath);
            const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);

            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true, // Send as voice note
                fileName: `voice_${effect}_${Date.now()}.mp3`
            });

            await sock.sendMessage(from, {
                text: `✅ *Voice effect applied!*\n\n🎭 Effect: ${effect}\n📦 Size: ${fileSizeMB} MB`,
                edit: processingMsg.key
            });

            // Cleanup
            try {
                fs.unlinkSync(inputPath);
                fs.unlinkSync(convertedPath);
                fs.unlinkSync(outputPath);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }

        } catch (error) {
            console.error('❌ Voice change error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Voice effect failed!*\n\n📝 Error: ${error.message}\n\n💡 Make sure you replied to a voice note!`
            }, { quoted: msg });
        }
    }
};

// Convert to WAV format first
function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('wav')
            .audioCodec('pcm_s16le')
            .audioFrequency(44100)
            .audioChannels(1)
            .output(outputPath)
            .on('end', () => {
                console.log('WAV conversion complete');
                resolve();
            })
            .on('error', (err) => {
                console.error('WAV conversion error:', err);
                reject(err);
            })
            .run();
    });
}

// Apply voice effects
function applyVoiceEffect(inputPath, outputPath, effect) {
    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        // Apply different effects
        switch (effect) {
            case 'robot':
                // Robot voice: chorus + flanger
                command.audioFilters([
                    'afftdn=nf=-25',
                    'aecho=0.8:0.9:1000:0.3',
                    'chorus=0.5:0.9:50:0.4:0.25:2'
                ]);
                break;

            case 'chipmunk':
                // High pitch chipmunk voice
                command.audioFilters([
                    'asetrate=44100*1.5',
                    'aresample=44100',
                    'atempo=1.0'
                ]);
                break;

            case 'deep':
                // Deep/low pitch voice
                command.audioFilters([
                    'asetrate=44100*0.75',
                    'aresample=44100',
                    'atempo=1.0'
                ]);
                break;

            case 'echo':
                // Strong echo effect
                command.audioFilters('aecho=0.8:0.88:60:0.4');
                break;

            case 'reverse':
                // Reverse audio
                command.audioFilters('areverse');
                break;

            case 'fast':
                // Speed up 2x
                command.audioFilters('atempo=2.0');
                break;

            case 'slow':
                // Slow down 0.5x
                command.audioFilters('atempo=0.5');
                break;

            default:
                command.audioFilters('volume=1.0');
        }

        command
            .toFormat('mp3')
            .audioBitrate('128k')
            .audioCodec('libmp3lame')
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('end', () => {
                console.log('Effect applied successfully');
                resolve();
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .run();
    });
}