// commands/livescore.js - Simple live football scores (No API Key Required)

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

            // Use TheSportsDB - Completely free, no key needed
            const response = await axios.get('https://www.thesportsdb.com/api/v1/json/3/livescore.php?s=Soccer', {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const allEvents = response.data?.events || [];
            
            // Filter for live/ongoing matches only
            const liveMatches = allEvents.filter(match => 
                match.strStatus && 
                (match.strStatus.includes('1H') || 
                 match.strStatus.includes('2H') || 
                 match.strStatus.includes('HT') ||
                 match.strStatus === 'In Progress')
            );

            if (liveMatches.length === 0) {
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
            const displayMatches = liveMatches.slice(0, 15);

            displayMatches.forEach((match) => {
                const homeTeam = match.strHomeTeam || 'Home Team';
                const awayTeam = match.strAwayTeam || 'Away Team';
                const homeScore = match.intHomeScore || '0';
                const awayScore = match.intAwayScore || '0';
                const league = match.strLeague || 'League';
                const status = match.strStatus || '--';

                // Status emoji
                let statusEmoji = '⚽';
                if (status.includes('HT')) {
                    statusEmoji = '⏸️';
                } else if (status.includes('1H')) {
                    statusEmoji = '🔴';
                } else if (status.includes('2H')) {
                    statusEmoji = '🟢';
                }

                matchesList += 
                    `├◆ 🏆 *${league}*\n` +
                    `├◆ ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n` +
                    `├◆ ${statusEmoji} ${status}\n` +
                    `│\n`;
            });

            const totalMatches = liveMatches.length;
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
                `├◆ 📡 *Source:* TheSportsDB\n` +
                `│\n` +
                `└ ❏\n` +
                `> Powered by 🎭Kelvin🎭`;

            await sock.sendMessage(from, {
                text: liveScoreMessage
            }, { quoted: msg });

            console.log(`⚽ Live scores: ${totalMatches} matches sent to ${from}`);

        } catch (error) {
            console.error('❌ Live score error:', error.message);

            await sock.sendMessage(from, {
                text: `┌ ❏ *⌜ ERROR ⌟* ❏\n` +
                    `│\n` +
                    `├◆ ❌ *Unable to fetch live scores*\n` +
                    `├◆ 📝 *Error:* ${error.message}\n` +
                    `│\n` +
                    `├◆ 💡 *Possible reasons:*\n` +
                    `├◆    • No internet connection\n` +
                    `├◆    • API is temporarily down\n` +
                    `├◆    • Request timeout\n` +
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