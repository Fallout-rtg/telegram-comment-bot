const TelegramBot = require('node-telegram-bot-api');

// Проверка наличия обязательных переменных окружения
if (!process.env.BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN environment variable is not set!');
}

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

// Получаем ID группы обсуждений из переменных окружения
const DISCUSSION_GROUP_ID = process.env.DISCUSSION_GROUP_ID;

// Текст комментария с правилами
const rulesText = `⚠️ **Краткие правила комментариев:**

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности (кроме внутриигрового). Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.
• Контент запрещённый к распространению на территории Российской Федерации будет удаляться а участник его запостивший будет заблокирован.

📡 [Наш чат](https://t.me/+qAcLEuOQVbZhYWFi) | [Discord](https://discord.gg/rBnww7ytM3) | [TikTok](https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1)`;

// Обработчик входящих сообщений
module.exports = async (req, res) => {
  try {
    // Всегда сначала отвечаем Telegram, чтобы не было таймаута
    res.status(200).send('OK');
    
    const update = req.body;
    
    // Проверяем наличие тела запроса
    if (!update) {
      console.log('No update received');
      return;
    }
    
    console.log('Received update type:', update.message ? 'message' : update.channel_post ? 'channel_post' : 'unknown');

    // Обработка личных сообщений
    if (update.message && update.message.chat.type === 'private') {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      console.log('Processing private message');
      
      if (messageText === '/test') {
        console.log('Received /test command');
        try {
          await bot.sendMessage(chatId, '✅ Бот работает и готов к работе!', {
            disable_web_page_preview: true
          });
          console.log('Responded to /test command');
        } catch (error) {
          console.error('Error sending response to /test:', error.message);
        }
        return;
      }
      
      if (messageText === '/start') {
        console.log('Received /start command');
        try {
          await bot.sendMessage(
            chatId,
            '👋 Привет! К сожалению, я не отвечаю на личные сообщения.\n\nЯ — автоматический бот для канала @spektrminda. Моя задача — добавлять комментарии с правилами под каждым постом в том канале.\n\nПодписывайся на канал, чтобы видеть меня в действии! 😊',
            { disable_web_page_preview: true }
          );
          console.log('Responded to /start command');
        } catch (error) {
          console.error('Error sending response to /start:', error.message);
        }
        return;
      }
      
      console.log('Received unknown command in private chat:', messageText);
      return;
    }

    // Обработка сообщений в группе обсуждений
    if (update.message && DISCUSSION_GROUP_ID) {
      const message = update.message;
      const chatId = message.chat.id;
      
      console.log('Message received in chat:', chatId);
      console.log('Expected discussion group ID:', DISCUSSION_GROUP_ID);
      
      // Проверяем, что сообщение пришло из правильной группы
      if (chatId.toString() === DISCUSSION_GROUP_ID.toString()) {
        // Проверяем, является ли сообщение автоматически пересланным из канала
        if (message.forward_from_chat && message.forward_from_chat.username === 'spektrminda') {
          console.log('New post from channel detected in discussion group');
          
          try {
            // Отправляем комментарий как ответ на пересланное сообщение
            await bot.sendMessage(DISCUSSION_GROUP_ID, rulesText, {
              parse_mode: 'Markdown',
              reply_to_message_id: message.message_id,
              disable_web_page_preview: true
            });
            console.log('Comment successfully added to the discussion');
          } catch (error) {
            console.error('Error sending comment to discussion:', error.message);
          }
        } else {
          console.log('Message is not forwarded from @spektrminda channel');
        }
      } else {
        console.log('Message is not from discussion group');
      }
    } else if (!DISCUSSION_GROUP_ID) {
      console.log('DISCUSSION_GROUP_ID environment variable is not set');
    }

    // Обработка постов в канале
    if (update.channel_post) {
      console.log('Channel post detected, but comments should be in discussion group');
    }
  } catch (error) {
    console.error('General error in handler:', error);
  }
};
