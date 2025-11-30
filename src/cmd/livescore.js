// commands/livescore.js - Live football scores using API-Football (Free)

const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

            // Load config from obfuscated base64
            const configPath = path.join(__dirname, '../config/api-config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            const API_KEY = Buffer.from(config.x5a, 'base64').toString('utf-8');
            const API_URL = Buffer.from(config.x5b, 'base64').toString('utf-8');

            const response = await axios.get(`${API_URL}/fixtures`, {
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

            // Priority leagues to show first
            const priorityLeagues = [
                'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
                'UEFA Champions League', 'UEFA Europa League', 'FIFA World Cup',
                'Championship', 'FA Cup', 'Carabao Cup'
            ];

            // Sort matches: priority leagues first, then others
            const sortedMatches = matches.sort((a, b) => {
                const leagueA = a.league?.name || '';
                const leagueB = b.league?.name || '';

                const priorityA = priorityLeagues.some(pl => leagueA.includes(pl));
                const priorityB = priorityLeagues.some(pl => leagueB.includes(pl));

                if (priorityA && !priorityB) return -1;
                if (!priorityA && priorityB) return 1;
                return 0;
            });

            // Show up to 50 matches
            const displayMatches = sortedMatches.slice(0, 50);

            // Split into chunks for WhatsApp message limit
            const chunkSize = 15;
            const chunks = [];
            
            for (let i = 0; i < displayMatches.length; i += chunkSize) {
                chunks.push(displayMatches.slice(i, i + chunkSize));
            }

            // Send first chunk
            let matchesList = '';
            chunks[0].forEach((match) => {
                const homeTeam = match.teams?.home?.name || 'Home';
                const awayTeam = match.teams?.away?.name || 'Away';
                const homeScore = match.goals?.home ?? '0';
                const awayScore = match.goals?.away ?? '0';
                const league = match.league?.name || 'League';
                const elapsed = match.fixture?.status?.elapsed;
                const statusShort = match.fixture?.status?.short;

                let statusEmoji = '⚽';
                let timeDisplay = '--';

                if (statusShort === 'HT') {
                    statusEmoji = '⏸️';
                    timeDisplay = 'Half Time';
                } else if (statusShort === '1H' && elapsed) {
                    statusEmoji = '⏰';
                    timeDisplay = `${elapsed}'`;
                } else if (statusShort === '2H' && elapsed) {
                    statusEmoji = '⏰';
                    timeDisplay = `${elapsed}'`;
                } else if (statusShort === 'LIVE' && elapsed) {
                    statusEmoji = '⏰';
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
                `┌ ❏ *⌜ LIVE SCORES (1/${chunks.length}) ⌟* ❏\n` +
                `│\n` +
                matchesList +
                `└ ❏\n` +
                `┌ ❏ ◆ *⌜MATCH INFO⌟* ◆\n` +
                `│\n` +
                `├◆ 📊 *Total Live:* ${totalMatches} ${totalMatches === 1 ? 'match' : 'matches'}\n` +
                `├◆ 📄 *Showing:* ${chunks[0].length} of ${displayMatches.length}\n` +
                `├◆ 🔄 *Refresh:* /livescore\n` +
                `├◆ 🕐 *Updated:* ${currentTime} WAT\n` +
                `├◆ 📡 *Source:* API-Football\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 🎭Kelvin🎭`;

            await sock.sendMessage(from, {
                text: liveScoreMessage
            }, { quoted: msg });

            // Send remaining chunks
            for (let i = 1; i < chunks.length; i++) {
                let chunkList = '';
                chunks[i].forEach((match) => {
                    const homeTeam = match.teams?.home?.name || 'Home';
                    const awayTeam = match.teams?.away?.name || 'Away';
                    const homeScore = match.goals?.home ?? '0';
                    const awayScore = match.goals?.away ?? '0';
                    const league = match.league?.name || 'League';
                    const elapsed = match.fixture?.status?.elapsed;
                    const statusShort = match.fixture?.status?.short;

                    let statusEmoji = '⚽';
                    let timeDisplay = '--';

                    if (statusShort === 'HT') {
                        statusEmoji = '⏸️';
                        timeDisplay = 'Half Time';
                    } else if (statusShort === '1H' && elapsed) {
                        statusEmoji = '⏰';
                        timeDisplay = `${elapsed}'`;
                    } else if (statusShort === '2H' && elapsed) {
                        statusEmoji = '⏰';
                        timeDisplay = `${elapsed}'`;
                    } else if (statusShort === 'LIVE' && elapsed) {
                        statusEmoji = '⏰';
                        timeDisplay = `${elapsed}'`;
                    } else if (statusShort === 'FT') {
                        statusEmoji = '✅';
                        timeDisplay = 'Full Time';
                    }

                    chunkList += 
                        `├◆ 🏆 *${league}*\n` +
                        `├◆ ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n` +
                        `├◆ ${statusEmoji} ${timeDisplay}\n` +
                        `│\n`;
                });

                const chunkMessage = 
                    `┌ ❏ *⌜ LIVE SCORES (${i + 1}/${chunks.length}) ⌟* ❏\n` +
                    `│\n` +
                    chunkList +
                    `└ ❏\n` +
                    `> Powered by 🎭Kelvin🎭`;

                await sock.sendMessage(from, {
                    text: chunkMessage
                }, { quoted: msg });

                // Delay between messages
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`⚽ Live scores: ${totalMatches} matches sent in ${chunks.length} messages to ${from}`);

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