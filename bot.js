const TelegramBot = require('node-telegram-bot-api');
const token = '6125338945:AAEFX_N-th4yt8QIVmh_C0aNyD2ssGr0uuA';
const bot = new TelegramBot(token, { polling: true });

const partners = {
  'UZUM NASIYA': { periods: { '3 oy': 11, '6 oy': 26, '12 oy': 44 } },
  'INTEND': { periods: { '3 oy': 10, '6 oy': 20, '12 oy': 30 } },
  'ALIF NASIYA': { periods: { '1 oy': 27, '3 oy': 37, '6 oy': 26, '9 oy': 44, '12 oy': 50, '15 oy': 62, '18 oy': 68, '24 oy': 87 } },
  'IMAN PAY': { periods: { '3 oy': 31, '6 oy': 41, '9 oy': 51, '12 oy': 58 } },
  'SOLFY': { periods: { '3 oy': 8 } },
  'OPEN': { periods: { '12 oy': 32 } },
  'BUYSENSE NASIYA': { periods: {'3 oy': 30, '6 oy': 48, '9 oy': 62, '12 oy': 77 } } // Assuming no periods provided for BUYSENSE NASIYA
};

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

bot.onText(new RegExp(Object.keys(partners).join('|')), (msg) => {
  const chatId = msg.chat.id;
  const partner = msg.text;
  const text = 'Davrni tanlang:';
  const periods = partners[partner].periods;
  const keyboard = {
    reply_markup: {
      keyboard: [...Object.keys(periods).map(period => [period]), ['Orqaga']],
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, text, keyboard);

  bot.onText(new RegExp(Object.keys(periods).join('|')), (msg) => {
    const period = msg.text;
    const margin = periods[period];
    const text = 'Summani kiriting:';
    bot.sendMessage(chatId, text);

    bot.once('text', (msg) => {
      const amount = parseFloat(msg.text);
      const result = calculateInstallment(amount, margin, parseInt(period));
      bot.sendMessage(chatId, `${period}ga: ${result} so'mdan`);
    });
  });
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

function calculateInstallment(amount, partnerMargin, months) {
  const buysenseMargin = calculateMargin(amount);
  const totalAmount = amount + buysenseMargin + (amount * partnerMargin / 100);
  const installment = totalAmount / months;
  return formatCurrency(installment.toFixed(2));
}

bot.on('polling_error', (error) => {
  console.log(error);
});
