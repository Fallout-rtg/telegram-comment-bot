const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

// Текст комментария с правилами (ссылки будут синими)
const rulesText = `⚠️ **Краткие правила комментариев:**

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности (кроме внутриигрового). Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.
• Контент запрещённый к распространению на территории Российской Федерации будет удаляться а участник его запостивший будет заблокирован.

📡 [Наш чат](https://t.me/+qAcLEuOQVbZhYWFi) | [Дискорд](https://discord.gg/rBnww7ytM3) | [TikTok](https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1)`;

// Обработчик входящих сообщений от Telegram
module.exports = async (req, res) => {
  try {
    const update = req.body;
    
    // Обрабатываем сообщения из ЛИЧНЫХ чатов (команды /test и /start)
    if (update.message && update.message.chat.type === 'private') {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      if (messageText === '/test') {
        await bot.sendMessage(chatId, '✅ Бот работает и готов к работе! Сообщения в канале будут автоматически комментироваться.');
        return res.status(200).send('OK');
      }
      if (messageText === '/start') {
        await bot.sendMessage(chatId, '👋 Привет! К сожалению, я не отвечаю на личные сообщения. Я — автоматический бот для канала @spektrminda. Моя задача — добавлять комментарии с правилами под каждым постом. Подписывайся на канал, чтобы видеть меня в действии! 😊');
        return res.status(200).send('OK');
      }
      // Игнорируем любые другие сообщения в ЛС
      return res.status(200).send('OK');
    }

    // Обрабатываем сообщения из КАНАЛОВ
    if (update.channel_post) {
      const chatId = update.channel_post.chat.id;
      const messageId = update.channel_post.message_id;
      const channelUsername = update.channel_post.chat.username;

      // ПРОВЕРКА: Работаем только в канале @spektrminda!
      if (channelUsername === 'spektrminda') {
        // Пытаемся оставить комментарий
        try {
          await bot.sendMessage(chatId, rulesText, {
            parse_mode: 'Markdown',
            reply_to_message_id: messageId
          });
          console.log('Комментарий успешно оставлен под постом!');
        } catch (error) {
          console.error('Ошибка при отправке комментария. Возможно, у бота нет прав:', error.message);
        }
      } else {
        console.log('Получен пост из другого канала:', channelUsername, '. Игнорируем.');
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Общая ошибка:', error);
    res.status(200).send('OK');
  }
};
