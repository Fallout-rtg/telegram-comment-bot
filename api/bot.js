const TelegramBot = require('node-telegram-bot-api');

// Токен бота (будет установлен через переменные окружения)
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

// Текст комментария с правилами (с форматированием Markdown)
const rulesText = `⚠️ **Краткие правила комментариев:**

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности (кроме внутриигрового). Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.
• Контент запрещённый к распространению на территории Российской Федерации будет удаляться а участник его запостивший будет заблокирован.

📡 [Наш чат](https://t.me/+qAcLEuOQVbZhYWFi) | [Дискорд](https://discord.gg/rBnww7ytM3) | [TikTok](https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1)`;

// Функция для обработки входящих сообщений
module.exports = async (req, res) => {
  try {
    const update = req.body;
    
    // Обрабатываем личные сообщения
    if (update.message && update.message.chat.type === 'private') {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      if (messageText === '/test') {
        await bot.sendMessage(chatId, '✅ Бот работает и готов к работе! Сообщения в канале будут автоматически комментироваться.');
        return res.status(200).send('OK');
      }
      
      if (messageText === '/start') {
        await bot.sendMessage(
          chatId,
          '👋 Привет! К сожалению, я не отвечаю на личные сообщения.\n\nЯ — автоматический бот для канала @spektrminda. Моя задача — добавлять комментарии с правилами под каждым постом в том канале.\n\nПодписывайся на канал, чтобы видеть меня в действии! 😊'
        );
        return res.status(200).send('OK');
      }
      
      // Игнорируем все остальные сообщения в ЛС
      return res.status(200).send('OK');
    }

    // Обрабатываем посты в канале
    if (update.channel_post) {
      const chatId = update.channel_post.chat.id;
      const messageId = update.channel_post.message_id;
      const channelUsername = update.channel_post.chat.username;

      // Проверяем, что это нужный канал
      if (channelUsername === 'spektrminda') {
        try {
          // Отправляем комментарий как ответ на пост
          await bot.sendMessage(chatId, rulesText, {
            parse_mode: 'Markdown',
            reply_to_message_id: messageId
          });
          console.log('Комментарий с правилами добавлен под постом в канале @spektrminda');
        } catch (error) {
          console.error('Ошибка при отправке комментария:', error.message);
          
          // Если ошибка связана с правами, попробуем отправить без reply
          if (error.message.includes('reply') || error.message.includes('rights')) {
            try {
              await bot.sendMessage(chatId, rulesText, {
                parse_mode: 'Markdown'
              });
              console.log('Комментарий отправлен без привязки к посту');
            } catch (secondError) {
              console.error('Ошибка при повторной попытке отправки:', secondError.message);
            }
          }
        }
      } else {
        console.log('Получен пост из другого канала:', channelUsername, '. Игнорируем.');
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Общая ошибка в обработчике:', error);
    res.status(200).send('OK');
  }
};
