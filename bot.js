// 6125338945:AAEFX_N-th4yt8QIVmh_C0aNyD2ssGr0uuA

const TelegramBot = require('node-telegram-bot-api');
const token = '6125338945:AAEFX_N-th4yt8QIVmh_C0aNyD2ssGr0uuA';
const bot = new TelegramBot(token, { polling: true });

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
  const text = 'Oyni tanlang:';
  const keyboard = {
    reply_markup: {
      keyboard: [['12 oy', '6 oy']],
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, text, keyboard);
});

function formatCurrency(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function calculateInvestment(amount, period) {
  let result;
  if (amount <= 5000000) {
    result = (amount + (amount * 0.2)) * (1 + 0.44) / period;
  } else if (amount <= 8000000) {
    result = (amount + (amount * 0.15)) * (1 + 0.44) / period;
  } else {
    result = (amount + (amount * 0.1)) * (1 + 0.44) / period;
  }
  return formatCurrency(result);
}

bot.onText(/12 oy/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Summani kiriting:';
  bot.sendMessage(chatId, text);
  bot.once('text', (msg) => {
    const amount = parseFloat(msg.text);
    const result = calculateInvestment(amount, 12);
    bot.sendMessage(chatId, `12 oyga: ${result} so'mdan`);
  });
});

bot.onText(/6 oy/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Summani kiriting:';
  bot.sendMessage(chatId, text);
  bot.once('text', (msg) => {
    const amount = parseFloat(msg.text);
    const result = calculateInvestment(amount, 6);
    bot.sendMessage(chatId, `6 oyga: ${result} so'mdan`);
  });
});
