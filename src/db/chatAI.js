// chatAI.js - Real AI chat handler using Groq API

const axios = require('axios');

// ============================================
// 🔑 API KEY CONFIGURATION
// ============================================
// OPTION 1: Use environment variable (RECOMMENDED for production)
// Add to .env file: GROQ_API_KEY=gsk_your_key_here
// Then use: process.env.GROQ_API_KEY
 
// OPTION 2: Hardcode for testing (NOT RECOMMENDED for production)
// Uncomment and add your key below for quick testing:
const GROQ_API_KEY = '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'; // ⚠️ Replace with your actual key

// Get key from env or hardcoded value

// Validate API key
if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_KEY_HERE_FOR_TESTING') {
    console.warn('⚠️  WARNING: GROQ_API_KEY not configured!');
    console.warn('   Get your free key from: https://console.groq.com');
    console.warn('   Then either:');
    console.warn('   1. Add to .env file: GROQ_API_KEY=gsk_your_key');
    console.warn('   2. Or replace YOUR_KEY_HERE_FOR_TESTING in chatAI.js');
}

const settings = {
    enabled: false,
    messageCount: 0,
    conversationHistory: new Map() // Store conversation per user
};

/**
 * Chat with Groq AI API
 * @param {string} message - User's message
 * @param {string} userId - User ID for conversation context
 * @returns {Promise<string>} - AI response
 */
async function chatWithAI(message, userId) {
    try {
        // Get or create conversation history for this user
        if (!settings.conversationHistory.has(userId)) {
            settings.conversationHistory.set(userId, []);
        }

        const history = settings.conversationHistory.get(userId);

        // Add user message to history
        history.push({
            role: 'user',
            content: message
        });

        // Keep only last 10 messages to avoid token limits
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        // Build messages array with system prompt
        const messages = [
            {
                role: 'system',
                content: `You are a friendly, casual person chatting on WhatsApp. Chat naturally like a real human friend would:
- Keep responses SHORT (1-3 sentences max)
- Be warm and friendly
- Use emojis occasionally but don't overdo it
- Speak casually, like texting a friend
-Owner and founder kelvin Agbe from Nigeria 
- NO formal language or robotic responses
-note also speak accordingly to the user language to make it like human 
-also don't tell the user your a AI or not at like real human being 
-also try to avoid chat looks like robotic at like normal human your name is kelvin not get too emotion 
also get get used to the user chat and know what he hates and like 
-sometimes the user maybe chatting with kelvin act like your representing kelvin if is the person also at like you know them
- Reply naturally to questions and comments
- Show personality and emotion
- Use everyday language and slang when appropriate`
            },
            ...history
        ];

        console.log(`🤖 Sending to Groq API...`);

        // Call Groq API
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.9,
                max_tokens: 150,
                top_p: 1,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;

        // Add AI response to history
        history.push({
            role: 'assistant',
            content: aiResponse
        });

        console.log(`✅ AI Response: ${aiResponse.substring(0, 50)}...`);

        return aiResponse;

    } catch (error) {
        console.error('❌ Groq API error:', error.response?.data || error.message);

        // Fallback responses if API fails
        const fallbacks = [
            "Hmm, I'm having trouble thinking right now 😅",
            "Sorry, my brain just froze for a sec! Try again?",
            "Oops, lost my train of thought! What were we talking about?",
            "My connection's acting up! Can you repeat that?",
            "Sorry, I zoned out there for a moment 😄"
        ];

        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

/**
 * Clear conversation history for a user
 * @param {string} userId - User ID
 */
function clearHistory(userId) {
    settings.conversationHistory.delete(userId);
    console.log(`🗑️ Cleared conversation history for ${userId}`);
}

/**
 * Clear all conversation histories
 */
function clearAllHistories() {
    settings.conversationHistory.clear();
    console.log(`🗑️ Cleared all conversation histories`);
}

module.exports = {
    getSettings: () => settings,

    updateSettings: (newSettings) => {
        Object.assign(settings, newSettings);
        console.log('🤖 AI Chat settings updated:', settings);
        return settings;
    },

    handleAIChat: async (sock, from, message, msg) => {
        if (!settings.enabled) return false;

        try {
            const userId = from.split('@')[0];
            console.log(`🤖 Processing AI chat from ${userId}: ${message.substring(0, 50)}...`);

            // Send typing indicator
            await sock.sendPresenceUpdate('composing', from);

            // Get AI response
            const response = await chatWithAI(message, userId);

            // Stop typing
            await sock.sendPresenceUpdate('paused', from);

            // Send response
            await sock.sendMessage(from, {
                text: response.trim()
            }, { quoted: msg });

            settings.messageCount++;
            console.log(`✅ AI response sent (Total: ${settings.messageCount})`);
            return true;

        } catch (error) {
            console.error('❌ AI Chat handler error:', error);

            await sock.sendPresenceUpdate('paused', from);

            // Send error message
            await sock.sendMessage(from, {
                text: "Sorry, I'm having trouble thinking right now 😅 Try again in a moment!"
            }, { quoted: msg });

            return true;
        }
    },

    clearHistory: clearHistory,
    clearAllHistories: clearAllHistories
};
