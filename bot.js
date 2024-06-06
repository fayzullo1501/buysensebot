const TelegramBot = require('node-telegram-bot-api');
const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

// Объект для хранения состояния каждого пользователя
const userStates = {};

// Ваш объект с партнерами и периодами
const partners = {
  'UZUM NASIYA': { periods: { '3 oy': 11, '6 oy': 26, '12 oy': 44 } },
  'INTEND': { periods: { '3 oy': 10, '6 oy': 20, '12 oy': 30 } },
  'ALIF NASIYA': { periods: { '1 oy': 27, '3 oy': 37, '6 oy': 26, '9 oy': 44, '12 oy': 50, '15 oy': 62, '18 oy': 68, '24 oy': 87 } },
  'IMAN PAY': { periods: { '3 oy': 31, '6 oy': 41, '9 oy': 51, '12 oy': 58 } },
  'SOLFY': { periods: { '3 oy': 8 } },
  'OPEN': { periods: { '12 oy': 32 } },
  'BUYSENSE NASIYA': { periods: {'3 oy': 30, '6 oy': 48, '9 oy': 62, '12 oy': 77 } }
};

// Обработчик команды /start
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

// Обработчик команды Kanal
bot.onText(/Kanal/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Kanalga otish: [buysenseuz](https://t.me/buysenseuz)';
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// Обработчик команды Kalkulyator
bot.onText(/Kalkulyator/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: 'choose_partner' }; // Установка состояния выбора партнера
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

// Обработчик выбора партнера
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const currentState = userStates[chatId] || {};

  if (currentState.step === 'choose_partner' && partners[text]) {
    userStates[chatId] = { step: 'choose_period', partner: text }; // Установка состояния выбора периода
    const periods = partners[text].periods;
    const keyboard = {
      reply_markup: {
        keyboard: [...Object.keys(periods).map(period => [period]), ['Orqaga']],
        resize_keyboard: true,
      },
    };
    bot.sendMessage(chatId, 'Davrni tanlang:', keyboard);
  } else if (currentState.step === 'choose_period' && (text in partners[currentState.partner].periods || text === 'Orqaga')) {
    if (text === 'Orqaga') {
      delete userStates[chatId]; // Удаление состояния, чтобы пользователь мог начать сначала
      bot.emit('text', msg); // Перенаправление к обработчику команды Kalkulyator
      return;
    }
    userStates[chatId] = { step: 'enter_amount', partner: currentState.partner, period: text }; // Установка состояния ввода суммы
    bot.sendMessage(chatId, 'Summani kiriting:');
  } else if (currentState.step === 'enter_amount') {
    const amount = parseFloat(text);
    const partnerMargin = partners[currentState.partner].periods[currentState.period];
    const result = calculateInstallment(amount, partnerMargin, parseInt(currentState.period));
    bot.sendMessage(chatId, `${currentState.period}ga: ${result} so'mdan`);
    delete userStates[chatId]; // Удаление состояния после завершения расчета
  }
});

// Обработчик ошибок
bot.on('polling_error', (error) => {
  console.log(error);
});

// Функция для форматирования суммы
function formatCurrency(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Функция для расчета маржи
function calculateMargin(amount) {
  if (amount <= 3000000) {
    return amount * 0.2;
  } else if (amount <= 8000000) {
    return amount * 0.15;
  } else {
    return amount * 0.1;
  }
}

// Функция для расчета ежемесячного платежа
function calculateInstallment(amount, partnerMargin, months) {
  const buysenseMargin = calculateMargin(amount);
  const totalAmount = amount + buysenseMargin + (amount * partnerMargin / 100);
  const installment = totalAmount / months;
  return formatCurrency(installment.toFixed(2));
}
