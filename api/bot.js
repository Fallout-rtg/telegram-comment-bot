const { Telegraf, Markup } = require('telegraf');

// Загружаем токен из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;

// Константы
const CHANNEL_ID = -1002696885166;
const CHAT_ID = -1002899007927; // Чат канала
const ADMIN_CHAT_ID = -4969760870; // Чат администрации
const ADMIN_IDS = [2032240231, 1465194766];
const ADMIN_NAMES = {
  2032240231: 'Советчик 📜',
  1465194766: 'Спектр ♦️'
};

// Инициализируем бота
const bot = new Telegraf(BOT_TOKEN);

// Массив разрешенных чатов (изначально содержит только нужные чаты)
let ALLOWED_CHATS = [CHAT_ID, ADMIN_CHAT_ID];

// —————————— УПРАВЛЕНИЕ РАЗРЕШЕННЫМИ ЧАТАМИ —————————— //
// Команда для добавления чата в разрешенные
bot.command('+id', async (ctx) => {
  // Проверяем, является ли отправитель админом
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Эта команда доступна только администраторам.');
  }
  
  // Проверяем, указан ли ID чата
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('❌ Укажите ID чата после команды: /+id <ID_чата>');
  }
  
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) {
    return ctx.reply('❌ Неверный формат ID чата. Укажите числовой ID.');
  }
  
  // Добавляем чат в разрешенные, если его там еще нет
  if (!ALLOWED_CHATS.includes(chatId)) {
    ALLOWED_CHATS.push(chatId);
    return ctx.reply(`✅ Чат с ID ${chatId} добавлен в разрешенные.`);
  } else {
    return ctx.reply(`ℹ️ Чат с ID ${chatId} уже есть в списке разрешенных.`);
  }
});

// Команда для удаления чата из разрешенных
bot.command('-id', async (ctx) => {
  // Проверяем, является ли отправитель админом
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Эта команда доступна только администраторам.');
  }
  
  // Проверяем, указан ли ID чата
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('❌ Укажите ID чата после команды: /-id <ID_чата>');
  }
  
  const chatId = parseInt(args[1]);
  if (isNaN(chatId)) {
    return ctx.reply('❌ Неверный формат ID чата. Укажите числовой ID.');
  }
  
  // Удаляем чат из разрешенных, если он там есть
  const index = ALLOWED_CHATS.indexOf(chatId);
  if (index !== -1) {
    ALLOWED_CHATS.splice(index, 1);
    return ctx.reply(`✅ Чат с ID ${chatId} удален из разрешенных.`);
  } else {
    return ctx.reply(`ℹ️ Чат с ID ${chatId} не найден в списке разрешенных.`);
  }
});

// Команда для просмотра разрешенных чатов
bot.command('/allowed_chats', async (ctx) => {
  // Проверяем, является ли отsender админом
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Эта команда доступна только администраторам.');
  }
  
  if (ALLOWED_CHATS.length === 0) {
    return ctx.reply('📝 Список разрешенных чатов пуст.');
  }
  
  const chatList = ALLOWED_CHATS.map(id => `• ${id}`).join('\n');
  return ctx.reply(`📝 Разрешенные чаты:\n${chatList}`);
});

// —————————— ЗАЩИТА ОТ ДОБАВЛЕНИЯ В ЧУЖИЕ ЧАТЫ —————————— //
bot.on('message', async (ctx) => {
  // Проверяем, добавлен ли бот в новый чат
  if (ctx.message.new_chat_members) {
    const newMembers = ctx.message.new_chat_members;
    const isBotAdded = newMembers.some(member => member.is_bot && member.id === ctx.botInfo.id);
    
    if (isBotAdded) {
      const chatId = ctx.chat.id;
      
      // Проверяем, разрешен ли этот чат
      if (!ALLOWED_CHATS.includes(chatId)) {
        try {
          // Создаем инлайн-кнопку с ссылкой
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.url('Красная звезда', 'https://t.me/red_star_development')]
          ]);
          
          // Отправляем сообщение перед выходом
          await ctx.reply(
            `🚫 Я не могу работать в этом чате!\n\nЭтот чат не входит в список разрешенных. Если вам нужен подобный бот, обратитесь в Красная звезда за помощью.`,
            { 
              reply_markup: keyboard.reply_markup,
              disable_web_page_preview: true 
            }
          );
          
          // Ждем немного перед выходом
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Покидаем чат
          await ctx.leaveChat();
        } catch (error) {
          console.error('Ошибка при выходе из чата:', error);
        }
      }
    }
  }
});

// —————————— ОБРАБОТКА КОМАНДЫ /HELP —————————— //
bot.help(async (ctx) => {
  const userId = ctx.from.id;
  const chatType = ctx.chat.type;
  
  // Если команда отправлена в личных сообщениях
  if (chatType === 'private') {
    // Проверяем, является ли пользователь админом
    if (ADMIN_IDS.includes(userId)) {
      // Сообщение для админов
      const adminHelpText = `🛠️ *Команды для администраторов:*\n\n`
        + `/start - Запуск бота и приветствие\n`
        + `/help - Показать это сообщение\n`
        + `/info - Информация о боте\n`
        + `/test - Проверить работоспособность бота\n`
        + `/+id <ID_чата> - Добавить чат в разрешенные\n`
        + `/-id <ID_чата> - Удалить чат из разрешенных\n`
        + `/allowed_chats - Показать список разрешенных чатов\n\n`
        + `*Функции для админов:*\n`
        + `• Ответ на пересланные сообщения из ЛС пользователей\n`
        + `• Ответ по ссылке на сообщение формата https://t.me/c/...\n`
        + `• Все сообщения от пользователей пересылаются в чат администрации\n\n`
        + `*Как отвечать пользователям:*\n`
        + `1. Ответьте (reply) на пересланное сообщение в чате администрации\n`
        + `2. Или отправьте ссылку на сообщение, а на следующей строке - ответ\n`
        + `3. Бот сохранит ваше форматирование (жирный текст, курсив и т.д.)`;
      
      await ctx.reply(adminHelpText, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      });
    } else {
      // Сообщение для обычных пользователей
      const userHelpText = `ℹ️ *Помощь по боту:*\n\n`
        + `Я - автоматический бот для канала. Моя основная задача - добавлять комментарии с правилами под каждым постом в канале.\n\n`
        + `*Доступные команды:*\n`
        + `/start - Запустить бота\n`
        + `/help - Получить помощь\n`
        + `/info - Информация о боте\n\n`
        + `Если у вас есть вопросы или предложения, обратитесь к администраторам канала.`;
      
      await ctx.reply(userHelpText, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      });
    }
  }
});

// —————————— ОБРАБОТКА ЛИЧНЫХ СООБЩЕНИЙ —————————— //
// Обработка команды /start
bot.start((ctx) => {
  const user = ctx.message.from;
  const userName = user.first_name || 'пользователь';
  const userID = user.id;

  let greeting = `Здравствуйте, ${userName}! 👋\n\nЯ — автоматический бот для канала.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.`;

  // Особое обращение к админам
  if (ADMIN_IDS.includes(userID)) {
    const adminName = ADMIN_NAMES[userID] || 'Администратор';
    greeting = `Приветствую, ${adminName}! 👋\n\nРад вас снова видеть! Я готов к работе и слежу за каналом.`;
  }

  ctx.reply(greeting);
});

// Обработка команды /test
bot.command('test', (ctx) => {
  ctx.reply('✅ Бот активен и работает в штатном режиме!');
});

// Обработка команды /info
bot.command('info', (ctx) => {
  const infoText = `⚙️О боте⚙️\nВерсия: 0.0.1\nИИ: Red-AI 0.1 \nРазработчики: Красная звезда`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('Красная звезда', 'https://t.me/red_star_development')]
  ]);
  ctx.reply(infoText, {
    reply_markup: keyboard.reply_markup,
    disable_web_page_preview: true
  });
});

// —————————— РЕЖИМ АДМИНИСТРИРОВАНИЯ —————————— //
// Обработка сообщений от админов (ответы на пересланные сообщения)
bot.on('message', async (ctx) => {
  const message = ctx.message;
  const userId = message.from.id;
  const chatId = message.chat.id;

  // Проверяем, является ли отправитель админом
  if (ADMIN_IDS.includes(userId)) {
    // Проверяем, является ли сообщение ответом на другое сообщение
    if (message.reply_to_message) {
      const repliedMessage = message.reply_to_message;
      // Проверяем, что это сообщение было переслано из чата администрирования
      if (repliedMessage.forward_origin && repliedMessage.forward_origin.type === 'user') {
        // Извлекаем оригинального отправителя из пересланного сообщения
        const originalSender = repliedMessage.forward_origin.sender_user;
        if (originalSender) {
          const userChatId = originalSender.id;
          const adminName = ADMIN_NAMES[userId] || 'Администратор';

          // Формируем ответ, сохраняя форматирование (если есть)
          let responseText = `🔹 Ответ от ${adminName}:\n\n`;
          if (message.text) {
            responseText += message.text;
          } else if (message.caption) {
            responseText += message.caption;
          }

          // Пытаемся передать entities для форматирования
          const options = {};
          if (message.entities) {
            options.entities = message.entities;
          }
          if (message.caption_entities) {
            options.caption_entities = message.caption_entities;
          }

          // Отправляем текст
          try {
            await ctx.telegram.sendMessage(userChatId, responseText, options);
            // Если есть медиа (фото, стикер и т.д.), отправляем их отдельно
            if (message.photo) {
              await ctx.telegram.sendPhoto(userChatId, message.photo[message.photo.length - 1].file_id, { caption: message.caption, caption_entities: message.caption_entities });
            } else if (message.sticker) {
              await ctx.telegram.sendSticker(userChatId, message.sticker.file_id);
            }
            // Можно добавить другие типы медиа (document, video и т.д.)
            await ctx.reply('✅ Ваш ответ был отправлен пользователю.');
          } catch (error) {
            console.error('Ошибка при отправке ответа пользователю:', error);
            await ctx.reply('❌ Не удалось отправить ответ пользователю. Возможно, он заблокировал бота или никогда не писал ему.');
          }
        }
      }
    }
    return; // Прекращаем дальнейшую обработку для админов
  }

  // —————————— ПЕРЕСЫЛКА СООБЩЕНИЙ ОТ ПОЛЬЗОВАТЕЛЕЙ —————————— //
  // Если сообщение от обычного пользователя (не админа) в ЛС и не команда
  if (chatId > 0 && !message.text?.startsWith('/')) {
    const user = message.from;
    const userName = user.first_name || user.last_name || 'Без имени';
    const userUsername = user.username ? `@${user.username}` : 'нет username';
    const time = new Date().toLocaleString('ru-RU');

    const caption = `📩 *Новое сообщение из ЛС*\n👤 *Имя:* ${userName}\n🔖 *Username:* ${userUsername}\n🆔 *ID:* ${user.id}\n⏰ *Время:* ${time}`;

    try {
      // Пересылаем само сообщение
      await ctx.forwardMessage(ADMIN_CHAT_ID, chatId, message.message_id);
      // Отправляем информацию о пользователе
      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, caption, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Ошибка при пересылке сообщения админам:', error);
    }
  }
});

// —————————— ЭКСПОРТ ДЛЯ VERCEL —————————— //
// Убираем bot.launch() и добавляем экспорт для serverless-функции Vercel
module.exports = async (req, res) => {
  try {
    // Обрабатываем обновление от Telegram
    await bot.handleUpdate(req.body, res);
  } catch (error) {
    console.error('Error handling update:', error);
    res.status(500).send('Internal Server Error');
  }
};
