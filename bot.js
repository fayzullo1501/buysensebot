process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const TelegramBot = require('node-telegram-bot-api');
const token = '6125338945:AAEFX_N-th4yt8QIVmh_C0aNyD2ssGr0uuA';
const bot = new TelegramBot(token, { polling: true });

const adminChatIds = ['472768937', '446415034']; // Replace with actual admin chat_ids

const partners = {
  'UZUM Nasiya': { periods: { '3 oy': 11, '6 oy': 26, '12 oy': 44 } },
  'InTend': { periods: { '3 oy': 10, '6 oy': 20, '12 oy': 30 } },
  'alif nasiya': { periods: { '1 oy': 27, '3 oy': 37, '6 oy': 26, '9 oy': 44, '12 oy': 50, '15 oy': 62, '18 oy': 68, '24 oy': 87 } },
  'IMAN pay': { periods: { '3 oy': 31, '6 oy': 41, '9 oy': 51, '12 oy': 58 } },
  'SOLFY': { periods: { '3 oy': 8 } },
  'OPEN': { periods: { '12 oy': 32 } },
  'BUYSENSE Nasiya': { periods: { '3 oy': 30, '6 oy': 48, '9 oy': 62, '12 oy': 77 } }
};

const userState = {};
const subscribers = new Set(); // For storing chat_ids of all users

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  subscribers.add(chatId); // Add every user to the subscribers set
  sendMainMenu(chatId);
});

bot.onText(/Kanal/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Kanalga otish: [buysenseuz](https://t.me/buysenseuz)';
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

bot.onText(/Kalkulyator/, (msg) => {
  sendPartnerSelection(msg.chat.id);
  userState[msg.from.id] = { step: 1 };
});

bot.onText(/Yangilik qoshish/, (msg) => {
  const chatId = msg.chat.id;
  if (adminChatIds.includes(chatId.toString())) {
    userState[chatId] = { step: 'awaiting_post' };
    bot.sendMessage(chatId, 'Пожалуйста, отправьте изображение с текстом новости:');
  } else {
    bot.sendMessage(chatId, 'У вас нет прав для использования этой команды.');
  }
});

bot.onText(/Orqaga/, (msg) => {
  sendMainMenu(msg.chat.id);
  userState[msg.from.id] = { step: 0 };
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userState[userId]) {
    userState[userId] = { step: 0 };
  }

  const step = userState[userId].step;

  if (step === 'awaiting_post' && adminChatIds.includes(chatId.toString())) {
    // Admin is entering post text
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1].file_id;
      const caption = msg.caption || '';
      subscribers.forEach((id) => {
        bot.sendPhoto(id, photo, { caption: caption });
      });
      userState[chatId] = { step: 0 };
      sendMainMenu(chatId); // Return admin to main menu
    } else {
      bot.sendMessage(chatId, 'Пожалуйста, отправьте изображение с текстом.');
    }
  } else if (partners[msg.text]) {
    // Partner selected
    userState[userId].partner = msg.text;
    bot.sendMessage(chatId, 'Summani kiriting:', {
      reply_markup: {
        keyboard: [['Orqaga']],
        resize_keyboard: true,
      },
    });
    userState[userId].step = 2;
  } else if (step === 2) {
    // Amount entered
    const amount = parseFloat(msg.text);
    if (isNaN(amount) || amount <= 0) {
      bot.sendMessage(chatId, 'Iltimos, to\'g\'ri summani kiriting.');
    } else {
      const periods = partners[userState[userId].partner].periods;
      let resultText = 'Rassrochka hisob-kitoblari:\n';
      for (let period in periods) {
        const margin = periods[period];
        const result = calculateInstallment(amount, margin, parseInt(period));
        resultText += `${period}: ${result} so'mdan\n`;
      }
      bot.sendMessage(chatId, resultText, {
        reply_markup: {
          keyboard: [['Orqaga']],
          resize_keyboard: true,
        },
      });
    }
  }
});

function sendMainMenu(chatId) {
  const text = 'Assalomu aleykum, BUYSENSE kalkulyatoriga xush kelibsiz!';
  const keyboard = {
    reply_markup: {
      keyboard: adminChatIds.includes(chatId.toString())
        ? [['Kanal', 'Kalkulyator', 'Yangilik qoshish']]
        : [['Kanal', 'Kalkulyator']],
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, text, keyboard);
}

function sendPartnerSelection(chatId) {
  const text = 'Hamkorni tanlang:';
  const partnerKeys = Object.keys(partners);
  const keyboard = {
    reply_markup: {
      keyboard: [...partnerKeys.map(partner => [partner]), ['Orqaga']],
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, text, keyboard);
}

function formatCurrency(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function calculateMargin(amount) {
  if (amount <= 3000000) {
    return amount * 0.2;
  } else if (amount <= 8000000) {
    return amount * 0.15;
  } else {
    return amount * 0.1;
  }
}

function calculateInstallment(amount, partnerMargin, period) {
  const buysenseMargin = calculateMargin(amount);
  const amountWithBuysenseMargin = amount + buysenseMargin;
  const totalMargin = amountWithBuysenseMargin * (partnerMargin / 100);
  const totalAmount = amountWithBuysenseMargin + totalMargin;
  const months = parseInt(period);
  const installment = totalAmount / months;
  return formatCurrency(installment.toFixed(2));
}

bot.on('polling_error', (error) => {
  console.log(error);
});
