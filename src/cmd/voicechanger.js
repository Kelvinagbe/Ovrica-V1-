const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

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
                    text: `❌ Invalid effect! Use: ${validEffects.join(', ')}`
                }, { quoted: msg });
            }

            const processingMsg = await sock.sendMessage(from, {
                text: `🎭 *Processing ${effect} effect...*\n\n⏳ Please wait...`
            }, { quoted: msg });

            // Download audio
            const buffer = await downloadMediaMessage(sock, audioMsg);
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const inputPath = path.join(tempDir, `input_${Date.now()}.ogg`);
            const outputPath = path.join(tempDir, `output_${Date.now()}.mp3`);
            
            fs.writeFileSync(inputPath, buffer);

            // Apply effect
            await applyVoiceEffect(inputPath, outputPath, effect);

            const audioBuffer = fs.readFileSync(outputPath);

            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true
            });

            await sock.sendMessage(from, {
                text: `✅ *Voice effect applied!*\n\n🎭 Effect: ${effect}`,
                edit: processingMsg.key
            });

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

        } catch (error) {
            console.error('❌ Voice change error:', error);
            await sock.sendMessage(from, {
                text: `❌ *Voice effect failed!*\n\n📝 Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};

async function applyVoiceEffect(inputPath, outputPath, effect) {
    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        switch (effect) {
            case 'robot':
                command.audioFilters('afftdn=nf=-25,aecho=0.8:0.9:1000:0.3');
                break;
            case 'chipmunk':
                command.audioFilters('asetrate=44100*1.5,atempo=1/1.5');
                break;
            case 'deep':
                command.audioFilters('asetrate=44100*0.75,atempo=1/0.75');
                break;
            case 'echo':
                command.audioFilters('aecho=0.8:0.88:60:0.4');
                break;
            case 'reverse':
                command.audioFilters('areverse');
                break;
            case 'fast':
                command.audioFilters('atempo=2.0');
                break;
            case 'slow':
                command.audioFilters('atempo=0.5');
                break;
        }

        command
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

async function downloadMediaMessage(sock, message) {
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const stream = await downloadContentFromMessage(message, 'audio');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}