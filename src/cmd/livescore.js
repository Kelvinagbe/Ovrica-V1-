// commands/livescore.js - Live football scores (Free, No API Key Required)

const axios = require('axios');

module.exports = {
    name: 'livescore',
    admin: false,
    description: 'Get live football match scores',
    
    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Send loading message
            const loadMsg = await sock.sendMessage(from, {
                text: '⚽ *Fetching live scores...*'
            }, { quoted: msg });

            // Using completely free API - No key needed!
            const response = await axios.get('https://api.allsportsapi.com/football/?met=Livescore&APIkey=', {
                timeout: 10000
            });

            const matches = response.data?.result || [];

            if (matches.length === 0) {
                // Edit the loading message instead of deleting
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ LIVE SCORES ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ⚽ *No live matches currently*\n` +
                        `│\n` +
                        `├◆ 📅 *Typical Match Times:*\n` +
                        `├◆    • Saturday: 12:30 - 20:00 GMT\n` +
                        `├◆    • Sunday: 14:00 - 20:00 GMT\n` +
                        `├◆    • Midweek: 19:45 - 21:00 GMT\n` +
                        `├◆    • Champions League: Tue/Wed 20:00 GMT\n` +
                        `│\n` +
                        `├◆ 🕐 *Current Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                        `├◆ 🔄 *Refresh:* /livescore\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`,
                    edit: loadMsg.key
                }, { quoted: msg });
            }

            // Build matches list
            let matchesList = '';
            const displayMatches = matches.slice(0, 15);
            
            displayMatches.forEach((match) => {
                const homeTeam = match.event_home_team || 'Home Team';
                const awayTeam = match.event_away_team || 'Away Team';
                const homeScore = match.event_final_result?.split(' - ')[0] || '0';
                const awayScore = match.event_final_result?.split(' - ')[1] || '0';
                const league = match.league_name || 'League';
                const time = match.event_status || '--';

                // Status emoji
                let statusEmoji = '🔴';
                if (time.includes('Half')) {
                    statusEmoji = '⏸️';
                } else if (time.includes('Finished')) {
                    statusEmoji = '✅';
                } else if (time.includes("'")) {
                    statusEmoji = '⚽';
                }

                matchesList += 
                    `├◆ 🏆 *${league}*\n` +
                    `├◆ ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n` +
                    `├◆ ${statusEmoji} ${time}\n` +
                    `│\n`;
            });

            const totalMatches = matches.length;
            const currentTime = new Date().toLocaleTimeString('en-US', { 
                timeZone: 'Africa/Lagos', 
                hour12: true,
                hour: '2-digit',
                minute: '2-digit'
            });

            const liveScoreMessage = 
                `┌ ❏ *⌜ LIVE SCORES ⌟* ❏\n` +
                `│\n` +
                matchesList +
                `└ ❏\n` +
                `┌ ❏ ◆ *⌜MATCH INFO⌟* ◆\n` +
                `│\n` +
                `├◆ 📊 *Total Live:* ${totalMatches} ${totalMatches === 1 ? 'match' : 'matches'}\n` +
                `├◆ 🔄 *Refresh:* /livescore\n` +
                `├◆ 🕐 *Updated:* ${currentTime} WAT\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 🎭Kelvin🎭`;

            // Edit the loading message with results
            await sock.sendMessage(from, {
                text: liveScoreMessage,
                edit: loadMsg.key
            }, { quoted: msg });

            console.log(`⚽ Live scores: ${totalMatches} matches sent to ${from}`);

        } catch (error) {
            console.error('❌ Live score error:', error);
            
            // Try alternative free API
            try {
                const liveScoreResponse = await axios.get('https://livescore-api.com/api-client/scores/live.json?key=demo&secret=demo', {
                    timeout: 10000
                });

                const liveMatches = liveScoreResponse.data?.data?.match || [];

                if (liveMatches.length === 0) {
                    return await sock.sendMessage(from, {
                        text: `┌ ❏ *⌜ LIVE SCORES ⌟* ❏\n` +
                            `│\n` +
                            `├◆ ⚽ *No live matches at the moment*\n` +
                            `│\n` +
                            `├◆ 🕐 *Current Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                            `├◆ 🔄 *Try again:* /livescore\n` +
                            `│\n` +
                            `└ ❏\n` +
                            `> Powered by 🎭Kelvin🎭`
                    }, { quoted: msg });
                }

                let matchesList = '';
                liveMatches.slice(0, 15).forEach((match) => {
                    const homeTeam = match.home_name || 'Home';
                    const awayTeam = match.away_name || 'Away';
                    const score = match.score || '0 - 0';
                    const league = match.league_name || 'League';
                    const time = match.time || '--';

                    matchesList += 
                        `├◆ 🏆 *${league}*\n` +
                        `├◆ ${homeTeam} ${score} ${awayTeam}\n` +
                        `├◆ ⚽ ${time}'\n` +
                        `│\n`;
                });

                const liveScoreMessage = 
                    `┌ ❏ *⌜ LIVE SCORES ⌟* ❏\n` +
                    `│\n` +
                    matchesList +
                    `└ ❏\n` +
                    `┌ ❏ ◆ *⌜MATCH INFO⌟* ◆\n` +
                    `│\n` +
                    `├◆ 📊 *Total Live:* ${liveMatches.length}\n` +
                    `├◆ 🔄 *Refresh:* /livescore\n` +
                    `├◆ 🕐 *Updated:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                await sock.sendMessage(from, {
                    text: liveScoreMessage,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363418958316196@newsletter",
                            newsletterName: "🎭 Kelvin Tech",
                            serverMessageId: 200
                        },
                        externalAdReply: {
                            title: "⚽ Live Football Scores",
                            body: `${liveMatches.length} live matches`,
                            thumbnailUrl: "./icon.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBODJPIiRonb0FL8q10",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });

            } catch (altError) {
                // Final fallback - simple message
                await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ❌ *Unable to fetch live scores*\n` +
                        `├◆ 📝 *Reason:* Connection issue\n` +
                        `│\n` +
                        `├◆ 💡 *Try:*\n` +
                        `├◆    • Check your internet\n` +
                        `├◆    • Wait a moment\n` +
                        `├◆    • Use /livescore again\n` +
                        `│\n` +
                        `├◆ 🕐 *Current Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }
        }
    }
};
Key Changes: