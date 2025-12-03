require('module-alias/register');
const { isBotAdmin } = require('../../utils/helpers/grouphelper');

module.exports = {
  name: 'gcadd',
  description: 'Add user to group with country code - Usage: !gcadd <country code><phone>',
  admin: true,

  async exec(sock, from, args, msg, isAdmin, sendWithTyping) {
    // Check if command is used in a group
    if (!from.endsWith('@g.us')) {
      return await sendWithTyping(sock, from, '❌ *This command only works in groups!*');
    }

    // Check if sender is admin
    if (!isAdmin) {
      return await sendWithTyping(sock, from, '❌ *Only admins can add members!*');
    }

    // Check if bot is admin
    if (!await isBotAdmin(sock, from)) {
      return await sendWithTyping(sock, from, '❌ *Make me admin first!*');
    }

    // Check if phone number is provided
    if (args.length === 0) {
      return await sendWithTyping(sock, from, 
        '❌ *Usage:* !gcadd <country code><phone number>\n\n' +
        '📝 *Examples:*\n' +
        '• !gcadd 11234567890 (US)\n' +
        '• !gcadd 447911123456 (UK)\n' +
        '• !gcadd 919876543210 (India)\n' +
        '• !gcadd 254712345678 (Kenya)\n\n' +
        '⚠️ *Important:*\n' +
        '• Include country code\n' +
        '• No + or spaces\n' +
        '• Only numbers'
      );
    }

    try {
      // Clean the number - remove all non-numeric characters
      let number = args[0].replace(/[^0-9]/g, '');
      
      // Validate number length
      if (!number || number.length < 10) {
        return await sendWithTyping(sock, from, 
          '❌ *Invalid phone number!*\n\n' +
          'Number must be at least 10 digits with country code.\n\n' +
          '📝 Example: !gcadd 1234567890'
        );
      }

      // Validate number isn't too long (max 15 digits per E.164 standard)
      if (number.length > 15) {
        return await sendWithTyping(sock, from, 
          '❌ *Phone number too long!*\n\n' +
          'Maximum 15 digits allowed.\n' +
          `You entered: ${number.length} digits`
        );
      }

      const targetUser = number + '@s.whatsapp.net';

      // Send processing message
      await sendWithTyping(sock, from, `⏳ *Checking number +${number}...*`);

      // Check if number exists on WhatsApp
      try {
        const [result] = await sock.onWhatsApp(targetUser);
        
        if (!result || !result.exists) {
          return await sendWithTyping(sock, from, 
            `❌ *Number not found!*\n\n` +
            `+${number} is not registered on WhatsApp.\n\n` +
            '💡 *Check:*\n' +
            '• Country code is correct\n' +
            '• Number is active\n' +
            '• No typos in number'
          );
        }
      } catch (checkError) {
        console.error('WhatsApp check error:', checkError);
        // Continue anyway if check fails
      }

      // Try to add user to group
      const response = await sock.groupParticipantsUpdate(
        from, 
        [targetUser], 
        'add'
      );

      // Handle different response statuses
      const status = response[0]?.status;
      const jid = response[0]?.jid;

      switch(status) {
        case '200':
          await sendWithTyping(sock, from, 
            `✅ *User added successfully!*\n\n` +
            `👤 +${number}\n` +
            `📱 Added to group`
          );
          break;

        case '403':
          await sendWithTyping(sock, from, 
            `❌ *Cannot add this user!*\n\n` +
            `👤 +${number}\n\n` +
            '🔒 *Possible reasons:*\n' +
            '• Privacy settings prevent adding\n' +
            '• User blocked the bot\n' +
            '• User left recently\n' +
            '• User has "Add to Groups" disabled\n\n' +
            '💡 *Solution:*\n' +
            'Send them the group invite link instead!'
          );
          break;

        case '408':
          await sendWithTyping(sock, from, 
            `❌ *User already in group!*\n\n` +
            `👤 +${number} is already a member.`
          );
          break;

        case '409':
          await sendWithTyping(sock, from, 
            `❌ *Group is full!*\n\n` +
            'Maximum 1024 members reached.\n' +
            'Remove inactive members first.'
          );
          break;

        case '401':
          await sendWithTyping(sock, from, 
            `❌ *Bot not authorized!*\n\n` +
            'Make sure bot is admin and has permissions.'
          );
          break;

        default:
          await sendWithTyping(sock, from, 
            `❌ *Failed to add user*\n\n` +
            `👤 +${number}\n` +
            `📝 Status: ${status || 'unknown'}\n\n` +
            '💡 Try again or use invite link'
          );
          break;
      }

    } catch (error) {
      console.error('❌ Add user error:', error);
      
      // Handle specific error types
      let errorMsg = '❌ *Failed to add user!*\n\n';
      
      if (error.message?.includes('forbidden')) {
        errorMsg += '🔒 *Privacy Error*\n' +
                    'User privacy settings prevent adding.';
      } else if (error.message?.includes('not-authorized')) {
        errorMsg += '⚠️ *Permission Error*\n' +
                    'Bot needs admin privileges.';
      } else if (error.message?.includes('participant-invalid-jid')) {
        errorMsg += '📱 *Invalid Number*\n' +
                    'Check the phone number format.';
      } else {
        errorMsg += `📝 *Error:* ${error.message || 'Unknown error'}\n\n` +
                    '💡 Try again or contact bot owner.';
      }
      
      await sendWithTyping(sock, from, errorMsg);
    }
  }
};