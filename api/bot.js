const TelegramBot = require('node-telegram-bot-api');

// Проверка наличия обязательных переменных окружения
if (!process.env.BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN environment variable is not set!');
}

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: false,
  requestOptions: {
    timeout: 10000,
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});

// Получаем ID группы обсуждений из переменных окружения
const DISCUSSION_GROUP_ID = process.env.DISCUSSION_GROUP_ID;

// ID известных пользователей
const KNOWN_USERS = {
  SPECTR: 1465194766,    // Спектр
  ADVISOR: 2032240231     // Советчик
};

// Текст комментария с правилами
const rulesText = `⚠️ **Краткие правила комментариев:**

• Спам категорически запрещён.
• Запрещён любой контент сексуальной направленности (кроме внутриигрового). Комментарии должны быть читабельны на работе.
• Ведите себя прилично, не оскорбляйте других участников и поддерживайте обсуждение только по теме поста.
• Любая политика или околополитический контент касающийся событий в реальной жизни запрещен.
• Контент запрещённый к распространению на территории Российской Федерации будет удаляться а участник его запостивший будет заблокирован.

📡 [Наш чат](https://t.me/+qAcLEuOQVbZhYWFi) | [Discord](https://discord.gg/rBnww7ytM3) | [TikTok](https://www.tiktok.com/@spectr_mindustry?_t=ZN-8yZCVx33mr9&_r=1)`;

// Функция для извлечения информации из ссылки на сообщение
function parseMessageLink(link) {
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    if (pathParts[0] === 'c' && pathParts.length >= 3) {
      const chatId = pathParts[1];
      const messageId = parseInt(pathParts[2]);
      
      return {
        chatId: parseInt('-100' + chatId),
        messageId: messageId
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing message link:', error);
    return null;
  }
}

// Функция для безопасной отправки сообщений с повторными попытками
async function safeSendMessage(chatId, text, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await bot.sendMessage(chatId, text, options);
      return result;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

// Функция для определения приветствия в зависимости от пользователя
function getWelcomeMessage(userId, firstName) {
  if (userId === KNOWN_USERS.SPECTR) {
    return `Здравствуйте, Спектр! 👋\n\nЯ — автоматический бот для вашего канала @spektrminda.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.\n\nТакже я могу отвечать на сообщения по ссылкам. Отправьте мне ссылку на сообщение, а на следующей строке — текст, который нужно отправить в ответ.`;
  } else if (userId === KNOWN_USERS.ADVISOR) {
    return `Здравствуйте, Советчик! 👋\n\nЯ — автоматический бот для канала @spektrminda.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.\n\nТакже я могу отвечать на сообщения по ссылкам. Отправьте мне ссылку на сообщение, а на следующей строке — текст, который нужно отправить в ответ.`;
  } else {
    return `👋 Привет${firstName ? ', ' + firstName : ''}! Я — автоматический бот для канала @spektrminda.\n\nМоя задача — добавлять комментарии с правилами под каждым постом в канале.\n\nПодписывайся на канал, чтобы видеть меня в действии! 😊`;
  }
}

// Обработчик входящих сообщений
module.exports = async (req, res) => {
  try {
    res.status(200).send('OK');
    
    const update = req.body;
    
    if (!update) {
      console.log('No update received');
      return;
    }
    
    console.log('Received update type:', update.message ? 'message' : update.channel_post ? 'channel_post' : 'unknown');

    // Обработка личных сообщений
    if (update.message && update.message.chat.type === 'private') {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;
      const userId = update.message.from.id;
      const firstName = update.message.from.first_name;

      console.log('Processing private message from user:', userId, 'name:', firstName);
      
      if (messageText === '/test') {
        console.log('Received /test command');
        try {
          await safeSendMessage(chatId, '✅ Бот работает и готов к работе!', {
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
          const welcomeMessage = getWelcomeMessage(userId, firstName);
          await safeSendMessage(
            chatId,
            welcomeMessage,
            { disable_web_page_preview: true }
          );
          console.log('Responded to /start command with personalized message');
        } catch (error) {
          console.error('Error sending response to /start:', error.message);
        }
        return;
      }
      
      // Обработка ссылки на сообщение и ответа (только для известных пользователей)
      if (userId === KNOWN_USERS.SPECTR || userId === KNOWN_USERS.ADVISOR) {
        const lines = messageText.split('\n');
        if (lines.length >= 2) {
          const link = lines[0].trim();
          const replyText = lines.slice(1).join('\n').trim();
          
          if (link.startsWith('https://t.me/c/')) {
            const messageInfo = parseMessageLink(link);
            
            if (messageInfo && replyText) {
              try {
                console.log('Attempting to reply to message:', messageInfo);
                
                await safeSendMessage(messageInfo.chatId, replyText, {
                  reply_to_message_id: messageInfo.messageId,
                  disable_web_page_preview: true
                });
                
                await safeSendMessage(chatId, '✅ Ответ успешно отправлен!', {
                  disable_web_page_preview: true
                });
                
              } catch (error) {
                console.error('Error sending reply:', error);
                await safeSendMessage(
                  chatId, 
                  '❌ Не удалось отправить ответ. Проверьте, что:\n' +
                  '1. Бот добавлен в группу как администратор\n' +
                  '2. Бот имеет права на отправку сообщений\n' +
                  '3. Ссылка корректна\n' +
                  `Ошибка: ${error.message}`,
                  { disable_web_page_preview: true }
                );
              }
              return;
            }
          }
        }
      }
      
      console.log('Received unknown command in private chat:', messageText);
      
      if (userId === KNOWN_USERS.SPECTR || userId === KNOWN_USERS.ADVISOR) {
        try {
          await safeSendMessage(
            chatId,
            'Чтобы отправить ответ на сообщение, отправьте мне ссылку на сообщение, ' +
            'а на следующей строке — текст ответа.\n\n' +
            'Пример:\n' +
            'https://t.me/c/123456789/123\n' +
            'Ваш ответ здесь',
            { disable_web_page_preview: true }
          );
        } catch (error) {
          console.error('Error sending help message:', error.message);
        }
      }
      
      return;
    }

    // Обработка постов в канале - ОСНОВНАЯ ФУНКЦИЯ БОТА
    if (update.channel_post) {
      const chatId = update.channel_post.chat.id;
      const messageId = update.channel_post.message_id;
      const channelUsername = update.channel_post.chat.username;

      console.log('Channel post detected in:', channelUsername);
      
      // Проверяем, что это нужный канал
      if (channelUsername === 'spektrminda') {
        console.log('Post in target channel, attempting to comment...');
        
        try {
          // Отправляем комментарий как ответ на пост
          await safeSendMessage(chatId, rulesText, {
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
            disable_web_page_preview: true
          });
          console.log('Comment successfully added under the post');
        } catch (error) {
          console.error('Error sending comment:', error.message);
          
          // Если ошибка связана с правами, попробуем отправить без reply
          if (error.message.includes('reply') || error.message.includes('rights')) {
            try {
              await safeSendMessage(chatId, rulesText, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
              });
              console.log('Comment sent without reply');
            } catch (secondError) {
              console.error('Error on second attempt:', secondError.message);
            }
          }
        }
      } else {
        console.log('Post from another channel:', channelUsername, '. Ignoring.');
      }
    }

    // Обработка сообщений в группе обсуждений (альтернативный способ)
    if (update.message && DISCUSSION_GROUP_ID) {
      const message = update.message;
      const chatId = message.chat.id;
      
      // Проверяем, что сообщение пришло из правильной группы
      if (chatId.toString() === DISCUSSION_GROUP_ID.toString()) {
        console.log('Message received in discussion group:', message.text || 'No text content');
        
        // Логируем полную структуру сообщения для отладки
        console.log('Full message structure:', JSON.stringify({
          has_forward_from_chat: !!message.forward_from_chat,
          forward_from_chat: message.forward_from_chat,
          chat: message.chat,
          text: message.text
        }, null, 2));
        
        // Проверяем, является ли сообщение автоматически пересланным из канала
        if (message.forward_from_chat) {
          console.log('Message is forwarded from chat:', message.forward_from_chat.username || message.forward_from_chat.id);
          
          if (message.forward_from_chat.username === 'spektrminda') {
            console.log('New post from channel detected in discussion group');
            
            try {
              // Отправляем комментарий как ответ на пересланное сообщение
              await safeSendMessage(DISCUSSION_GROUP_ID, rulesText, {
                parse_mode: 'Markdown',
                reply_to_message_id: message.message_id,
                disable_web_page_preview: true
              });
              console.log('Comment successfully added to the discussion');
            } catch (error) {
              console.error('Error sending comment to discussion:', error.message);
            }
          } else {
            console.log('Message is forwarded from different channel:', message.forward_from_chat.username);
          }
        } else {
          console.log('Message is not forwarded from any channel');
        }
      } else {
        console.log('Message is not from discussion group');
      }
    } else if (!DISCUSSION_GROUP_ID) {
      console.log('DISCUSSION_GROUP_ID environment variable is not set');
    }
  } catch (error) {
    console.error('General error in handler:', error);
  }
};
