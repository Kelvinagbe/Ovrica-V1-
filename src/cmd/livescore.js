// commands/livescore.js - Live football scores using API-Football (Free)

const axios = require('axios');

module.exports = {
    name: 'livescore',
    admin: false,
    description: 'Get live football match scores',

    exec: async (sock, from, args, msg, isAdmin) => {
        try {
            // Send loading message
            await sock.sendMessage(from, {
                text: '⚽ *Fetching live scores...*'
            }, { quoted: msg });

            // API-Football has a free tier - Get your free key at: https://dashboard.api-football.com/register
            // Free plan: 100 requests/day
            const API_KEY = '6e1e3679e7d21b117bcc728c36df3b6c'; // Replace with your free API key
            
            if (API_KEY === 'YOUR_API_KEY_HERE') {
                return await sock.sendMessage(from, {
                    text: `┌ ❏ *⌜ SETUP REQUIRED ⌟* ❏\n` +
                        `│\n` +
                        `├◆ ⚠️ *API Key Not Configured*\n` +
                        `│\n` +
                        `├◆ 📝 *Setup Steps:*\n` +
                        `├◆ 1️⃣ Visit: https://dashboard.api-football.com/register\n` +
                        `├◆ 2️⃣ Create a FREE account\n` +
                        `├◆ 3️⃣ Get your API key from dashboard\n` +
                        `├◆ 4️⃣ Add it to src/cmd/livescore.js line 14\n` +
                        `│\n` +
                        `├◆ 🎁 *Free Plan Includes:*\n` +
                        `├◆    • 100 requests per day\n` +
                        `├◆    • All competitions & endpoints\n` +
                        `├◆    • Live scores, fixtures, standings\n` +
                        `│\n` +
                        `└ ❏\n` +
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
                params: {
                    live: 'all'
                },
                headers: {
                    'x-rapidapi-key': API_KEY,
                    'x-rapidapi-host': 'v3.football.api-sports.io'
                },
                timeout: 10000
            });

            const matches = response.data?.response || [];

            if (matches.length === 0) {
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
                        `> Powered by 🎭Kelvin🎭`
                }, { quoted: msg });
            }

            // Build matches list
            let matchesList = '';
            const displayMatches = matches.slice(0, 15);

            displayMatches.forEach((match) => {
                const homeTeam = match.teams?.home?.name || 'Home';
                const awayTeam = match.teams?.away?.name || 'Away';
                const homeScore = match.goals?.home ?? '0';
                const awayScore = match.goals?.away ?? '0';
                const league = match.league?.name || 'League';
                const elapsed = match.fixture?.status?.elapsed;
                const statusShort = match.fixture?.status?.short;

                // Status emoji and time
                let statusEmoji = '⚽';
                let timeDisplay = '--';
                
                if (statusShort === 'HT') {
                    statusEmoji = '⏸️';
                    timeDisplay = 'Half Time';
                } else if (statusShort === '1H' && elapsed) {
                    statusEmoji = '🔴';
                    timeDisplay = `${elapsed}'`;
                } else if (statusShort === '2H' && elapsed) {
                    statusEmoji = '🟢';
                    timeDisplay = `${elapsed}'`;
                } else if (statusShort === 'LIVE' && elapsed) {
                    statusEmoji = '⚡';
                    timeDisplay = `${elapsed}'`;
                } else if (statusShort === 'FT') {
                    statusEmoji = '✅';
                    timeDisplay = 'Full Time';
                }

                matchesList += 
                    `├◆ 🏆 *${league}*\n` +
                    `├◆ ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n` +
                    `├◆ ${statusEmoji} ${timeDisplay}\n` +
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
                `├◆ 📡 *Source:* API-Football\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 🎭Kelvin🎭`;

            await sock.sendMessage(from, {
                text: liveScoreMessage
            }, { quoted: msg });

            console.log(`⚽ Live scores: ${totalMatches} matches sent to ${from}`);

        } catch (error) {
            console.error('❌ Live score error:', error.message);

            let errorMsg = error.message;
            if (error.response?.status === 429) {
                errorMsg = 'Daily API limit reached (100 requests/day on free plan)';
            } else if (error.response?.status === 401) {
                errorMsg = 'Invalid API key - Please check your configuration';
            }

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Unable to fetch live scores*\n` +
                    `├◆ 📝 *Error:* ${errorMsg}\n` +
                    `│\n` +
                    `├◆ 💡 *Possible reasons:*\n` +
                    `├◆    • API key not configured\n` +
                    `├◆    • Daily limit exceeded (100/day)\n` +
                    `├◆    • No internet connection\n` +
                    `│\n` +
                    `├◆ 🔄 *Try again:* /livescore\n` +
                    `├◆ 🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })}\n` +
                    `│\n` +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`
            }, { quoted: msg });
        }
    }
};