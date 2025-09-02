const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const DISCUSSION_GROUP_ID = process.env.DISCUSSION_GROUP_ID;

const rulesText = `⚠️ **Краткие правила комментариев:**

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности (кроме внутриигрового). Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.
• Контент запрещённый к распространению на территории Российской Федерации будет удаляться а участник его запостивший будет заблокирован.

📡 [Наш чат](https://t.me/+qAcLEuOQVbZhYWFi) | [Discord](https://discord.gg/rBnww7ytM3) | [TikTok](https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1)`;

module.exports = async (req, res) => {
  try {
    res.status(200).send('OK');
    const update = req.body;
    
    if (update.message && update.message.chat.type === 'private') {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      if (messageText === '/test') {
        await bot.sendMessage(chatId, '✅ Бот работает и готов к работе!', {
          disable_web_page_preview: true
        });
        return;
      }
      
      if (messageText === '/start') {
        await bot.sendMessage(
          chatId,
          '👋 Привет! К сожалению, я не отвечаю на личные сообщения.\n\nЯ — автоматический бот для канала @spektrminda. Моя задача — добавлять комментарии с правилами под каждым постом в том канале.\n\nПодписывайся на канал, чтобы видеть меня в действии! 😊',
          { disable_web_page_preview: true }
        );
        return;
      }
      return;
    }

    if (update.message && update.message.forward_from_chat && DISCUSSION_GROUP_ID) {
      const chatId = update.message.chat.id;
      const messageId = update.message.message_id;
      const forwardedChatUsername = update.message.forward_from_chat.username;

      if (forwardedChatUsername === 'spektrminda' && chatId.toString() === DISCUSSION_GROUP_ID.toString()) {
        try {
          await bot.sendMessage(chatId, rulesText, {
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
            disable_web_page_preview: true
          });
        } catch (error) {
          console.error('Error sending comment:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('General error:', error);
  }
};        await bot.sendMessage(chatId, '✅ Бот работает и готов к работе!', {
          disable_web_page_preview: true
        });
        return res.status(200).send('OK');
      }
      
      if (messageText === '/start') {
        await bot.sendMessage(
          chatId,
          '👋 Привет! К сожалению, я не отвечаю на личные сообщения.\n\nЯ — автоматический бот для канала @spektrminda.',
          { disable_web_page_preview: true }
        );
        return res.status(200).send('OK');
      }
    }

    // Обработка постов в канале
    if (update.channel_post) {
      const chatId = update.channel_post.chat.id;
      const messageId = update.channel_post.message_id;
      const channelUsername = update.channel_post.chat.username;

      // Проверяем, что это нужный канал
      if (channelUsername === 'spektrminda') {
        try {
          await bot.sendMessage(chatId, rulesText, {
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
            disable_web_page_preview: true
          });
        } catch (error) {
          console.error('Error sending message:', error.message);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Unhandled error:', error);
    res.status(500).send('Internal Server Error');
  }
};
