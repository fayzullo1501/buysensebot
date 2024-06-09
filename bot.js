const TelegramBot = require('node-telegram-bot-api');
const token = '6125338945:AAEFX_N-th4yt8QIVmh_C0aNyD2ssGr0uuA';
const bot = new TelegramBot(token, { polling: true });

const partners = {
  'UZUM Nasiya': { periods: { '3 oy': 11, '6 oy': 26, '12 oy': 44 } },
  'InTend': { periods: { '3 oy': 10, '6 oy': 20, '12 oy': 30 } },
  'alif nasiya': { periods: { '1 oy': 27, '3 oy': 37, '6 oy': 26, '9 oy': 44, '12 oy': 50, '15 oy': 62, '18 oy': 68, '24 oy': 87 } },
  'IMAN pay': { periods: { '3 oy': 31, '6 oy': 41, '9 oy': 51, '12 oy': 58 } },
  'SOLFY': { periods: { '3 oy': 8 } },
  'OPEN': { periods: { '12 oy': 32 } },
  'BUYSENSE Nasiya': { periods: {} }
};

const userState = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Assalomu aleykum, BUYSENSE kalkulyatoriga xush kelibsiz!';
  const keyboard = {
    reply_markup: {
      keyboard: [['Kanal', 'Kalkulyator']],
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, text, keyboard);
});

bot.onText(/Kanal/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Kanalga otish: [buysenseuz](https://t.me/buysenseuz)';
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

bot.onText(/Kalkulyator/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Hamkorni tanlang:';
  const partnerKeys = Object.keys(partners);
  const keyboard = {
    reply_markup: {
      keyboard: [...partnerKeys.map(partner => [partner]), ['Orqaga']],
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, text, keyboard);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userState[userId]) {
    userState[userId] = { step: 0 };
  }

  const step = userState[userId].step;

  switch (step) {
    case 1: // Choosing partner
      const partner = msg.text;
      if (partners[partner]) {
        userState[userId].partner = partner;
        const text = 'Davrni tanlang:';
        const periods = partners[partner].periods;
        const keyboard = {
          reply_markup: {
            keyboard: [...Object.keys(periods).map(period => [period]), ['Orqaga']],
            resize_keyboard: true,
          },
        };
        bot.sendMessage(chatId, text, keyboard);
        userState[userId].step = 2;
      } else {
        bot.sendMessage(chatId, 'Noto\'g\'ri tanlov. Iltimos, qaytadan tanlang.');
      }
      break;
    case 2: // Choosing period
      const period = msg.text;
      const margin = partners[userState[userId].partner].periods[period];
      const text = 'Summani kiriting:';
      bot.sendMessage(chatId, text);
      userState[userId].period = period;
      userState[userId].margin = margin;
      userState[userId].step = 3;
      break;
    case 3: // Entering amount
      const amount = parseFloat(msg.text);
      const result = calculateInstallment(amount, userState[userId].margin, parseInt(userState[userId].period));
      bot.sendMessage(chatId, `${userState[userId].period}ga: ${result} so'mdan`);
      delete userState[userId]; // Cleanup state after completion
      break;
    default:
      userState[userId].step = 1;
      break;
  }
});

bot.onText(/Orqaga/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Hamkorni tanlang:';
  const partnerKeys = Object.keys(partners);
  const keyboard = {
    reply_markup: {
      keyboard: [...partnerKeys.map(partner => [partner]), ['Orqaga']],
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, text, keyboard);
  userState[msg.from.id] = { step: 1 }; // Reset to step 1
});

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
