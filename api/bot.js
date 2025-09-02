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
    
    // Проверяем метод запроса
    if (req.method !== 'POST') {
      console.log('Received non-POST request');
      return;
    }
    
    const update = req.body;
    
    // Проверяем наличие тела запроса
    if (!update) {
      console.log('No update received');
      return;
    }
    
    console.log('Received update:', JSON.stringify(update));
    
    // Обработка личных сообщений
    if (update.message && update.message.chat.type === 'private') {
      console.log('Processing private message');
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      try {
        if (messageText === '/test') {
          console.log('Received /test command');
          await bot.sendMessage(chatId, '✅ Бот работает и готов к работе!', {
            disable_web_page_preview: true
          });
          console.log('Responded to /test command');
          return;
        }
        
        if (messageText === '/start') {
          console.log('Received /start command');
          await bot.sendMessage(
            chatId,
            '👋 Привет! К сожалению, я не отвечаю на личные сообщения.\n\nЯ — автоматический бот для канала @spektrminda. Моя задача — добавлять комментарии с правилами под каждым постом в том канале.\n\nПодписывайся на канал, чтобы видеть меня в действии! 😊',
            { disable_web_page_preview: true }
          );
          console.log('Responded to /start command');
          return;
        }
        
        console.log('Received unknown command in private chat:', messageText);
      } catch (error) {
        console.error('Error processing private message:', error.message);
      }
      return;
    }

    // Обработка сообщений в группе обсуждений
    if (update.message && DISCUSSION_GROUP_ID) {
      console.log('Message received in chat ID:', update.message.chat.id);
      console.log('Expected discussion group ID:', DISCUSSION_GROUP_ID);
      
      // Проверяем, что сообщение пришло из нужной группы
      if (update.message.chat.id.toString() === DISCUSSION_GROUP_ID.toString()) {
        console.log('Message is from discussion group');
        const message = update.message;
        
        // Проверяем, является ли сообщение автоматически пересланным из канала
        if (message.forward_from_chat) {
          console.log('Message is forwarded from chat:', message.forward_from_chat.username);
          
          if (message.forward_from_chat.username === 'spektrminda') {
            console.log('New post from @spektrminda detected in discussion group');
            
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
            console.log('Message forwarded from different channel:', message.forward_from_chat.username);
          }
        } else {
          console.log('Message is not forwarded from a channel');
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
