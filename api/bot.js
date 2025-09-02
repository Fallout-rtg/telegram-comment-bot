const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

// ID вашей группы обсуждений (замените на реальный)
const DISCUSSION_GROUP_ID = process.env.DISCUSSION_GROUP_ID || '-1001234567890';

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
    console.log('Received update:', JSON.stringify(update));
    
    // Обработка личных сообщений
    if (update.message && update.message.chat.type === 'private') {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      if (messageText === '/test') {
        await bot.sendMessage(chatId, '✅ Бот работает и готов к работе!', {
          disable_web_page_preview: true // Отключаем предпросмотр ссылок
        });
        return;
      }
      
      if (messageText === '/start') {
        await bot.sendMessage(
          chatId,
          '👋 Привет! К сожалению, я не отвечаю на личные сообщения.\n\nЯ — автоматический бот для канала @spektrminda. Моя задача — добавлять комментарии с правилами под каждым постом в том канале.\n\nПодписывайся на канал, чтобы видеть меня в действии! 😊',
          {
            disable_web_page_preview: true // Отключаем предпросмотр ссылок
          }
        );
        return;
      }
      
      return;
    }

    // Обработка сообщений в группе обсуждений
    if (update.message && update.message.chat.id.toString() === DISCUSSION_GROUP_ID.toString()) {
      const message = update.message;
      
      // Проверяем, является ли сообщение автоматически пересланным из канала
      if (message.forward_from_chat && message.forward_from_chat.username === 'spektrminda') {
        console.log('New post from channel detected in discussion group');
        
        try {
          // Отправляем комментарий как ответ на пересланное сообщение
          await bot.sendMessage(DISCUSSION_GROUP_ID, rulesText, {
            parse_mode: 'Markdown',
            reply_to_message_id: message.message_id,
            disable_web_page_preview: true // Отключаем предпросмотр ссылок [citation:1][citation:2]
          });
          console.log('Comment successfully added to the discussion');
        } catch (error) {
          console.error('Error sending comment to discussion:', error.message);
        }
      }
    }

    // Обработка постов в канале (на всякий случай оставляем)
    if (update.channel_post) {
      console.log('Channel post detected, but comments should be in discussion group');
    }
  } catch (error) {
    console.error('General error in handler:', error);
  }
};
