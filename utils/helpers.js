// utils/helpers.js - Production optimized, no debug logs

function getCleanNumber(jid) {
    try {
        if (!jid) return null;
        const jidStr = String(jid);
        const cleaned = jidStr
            .split('@')[0]
            .split(':')[0]
            .replace(/\D/g, '');
        return cleaned || null;
    } catch {
        return null;
    }
}

function isAdmin(jid, adminList) {
    try {
        if (!jid || !adminList || !Array.isArray(adminList) || adminList.length === 0) {
            return false;
        }

        const userNumber = getCleanNumber(jid);
        if (!userNumber) return false;

        return adminList.some(admin => {
            const adminNumber = getCleanNumber(admin);
            if (!adminNumber) return false;

            if (userNumber === adminNumber) return true;

            if (userNumber.length >= 10 && adminNumber.length >= 10) {
                return userNumber.slice(-10) === adminNumber.slice(-10);
            }

            return false;
        });

    } catch {
        return false;
    }
}

function getUserName(msg) {
    try {
        return msg?.pushName || 
               msg?.verifiedBizName || 
               msg?.key?.pushName || 
               msg?.notify ||
               'User';
    } catch {
        return 'User';
    }
}

function formatJid(number) {
    try {
        if (!number) return null;

        const cleaned = getCleanNumber(number);
        if (!cleaned) return null;

        if (String(number).includes('@s.whatsapp.net')) {
            return number;
        }

        if (String(number).includes('@lid')) {
            return number;
        }

        return `${cleaned}@s.whatsapp.net`;

    } catch {
        return null;
    }
}

function isGroup(jid) {
    try {
        return jid && String(jid).endsWith('@g.us');
    } catch {
        return false;
    }
}

function getSender(msg) {
    try {
        const from = msg.key?.remoteJid;
        if (!from) return null;

        if (isGroup(from)) {
            return msg.key.participantAlt || msg.key.participant || from;
        } else {
            return from;
        }

    } catch {
        return null;
    }
}

function parseMentions(text) {
    try {
        if (!text) return [];

        const matches = text.match(/@(\d+)/g);
        if (!matches) return [];

        return matches.map(match => {
            const number = match.replace('@', '');
            return `${number}@s.whatsapp.net`;
        });

    } catch {
        return [];
    }
}

function isOwner(jid, ownerNumber) {
    try {
        if (!jid || !ownerNumber) return false;

        const userNumber = getCleanNumber(jid);
        const owner = getCleanNumber(ownerNumber);

        if (!userNumber || !owner) return false;

        if (userNumber === owner) return true;

        if (userNumber.length >= 10 && owner.length >= 10) {
            return userNumber.slice(-10) === owner.slice(-10);
        }

        return false;

    } catch {
        return false;
    }
}

function isValidNumber(number) {
    try {
        if (!number) return false;

        const cleaned = getCleanNumber(number);

        return cleaned && cleaned.length >= 7 && cleaned.length <= 15;

    } catch {
        return false;
    }
}

function normalizeJid(jid) {
    try {
        if (!jid) return null;

        let normalized = String(jid).trim();

        if (normalized.endsWith('@lid')) {
            const number = getCleanNumber(normalized);
            return number ? `${number}@s.whatsapp.net` : normalized;
        }

        if (normalized.endsWith('@c.us')) {
            const number = getCleanNumber(normalized);
            return number ? `${number}@s.whatsapp.net` : normalized;
        }

        return normalized;

    } catch {
        return jid;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomChoice(array) {
    try {
        if (!Array.isArray(array) || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    } catch {
        return null;
    }
}

function truncate(text, maxLength = 100) {
    try {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    } catch {
        return '';
    }
}

function getQuotedMessage(msg) {
    try {
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (!contextInfo) return null;

        return {
            text: contextInfo.quotedMessage?.conversation || 
                  contextInfo.quotedMessage?.extendedTextMessage?.text || '',
            sender: contextInfo.participant,
            messageId: contextInfo.stanzaId
        };
    } catch {
        return null;
    }
}

function isSameUser(jid1, jid2) {
    try {
        if (!jid1 || !jid2) return false;

        const num1 = getCleanNumber(jid1);
        const num2 = getCleanNumber(jid2);

        if (!num1 || !num2) return false;

        if (num1 === num2) return true;

        if (num1.length >= 10 && num2.length >= 10) {
            return num1.slice(-10) === num2.slice(-10);
        }

        return false;

    } catch {
        return false;
    }
}

module.exports = { 
    isAdmin,
    getCleanNumber,
    getUserName,
    getSender,
    formatJid,
    normalizeJid,
    isGroup,
    isSameUser,
    isOwner,
    isValidNumber,
    parseMentions,
    getQuotedMessage,
    sleep,
    randomChoice,
    truncate
};