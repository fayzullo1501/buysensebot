process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
  'BUYSENSE Nasiya': { periods: { '3 oy': 30, '6 oy': 48, '9 oy': 62, '12 oy': 77 } }
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
  sendPartnerSelection(msg.chat.id);
  userState[msg.from.id] = { step: 1 };
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userState[userId]) {
    userState[userId] = { step: 0 };
  }

  const step = userState[userId].step;
  const partner = msg.text;

  if (partners[partner]) {
    // Partner selected, ask for amount
    userState[userId].partner = partner;
    const text = 'Summani kiriting:';
    bot.sendMessage(chatId, text);
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
      bot.sendMessage(chatId, resultText);
      sendPartnerSelection(chatId); // Return to partner selection
      userState[userId].step = 1; // Reset state to allow new partner selection
    }
  } else {
    bot.sendMessage(chatId, 'Noto\'g\'ri tanlov. Iltimos, qaytadan tanlang.');
    sendPartnerSelection(chatId);
  }
});

function sendPartnerSelection(chatId) {
  const text = 'Hamkorni tanlang:';
  const partnerKeys = Object.keys(partners);
  const keyboard = {
    reply_markup: {
      keyboard: partnerKeys.map(partner => [partner]),
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
