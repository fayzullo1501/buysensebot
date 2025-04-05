process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const TelegramBot = require('node-telegram-bot-api');
const token = '6125338945:AAEFX_N-th4yt8QIVmh_C0aNyD2ssGr0uuA';
const bot = new TelegramBot(token, { polling: true });

const adminChatIds = ['472768937', '446415034']; // Replace with actual admin chat_ids

const partners = {
  'UZUM Nasiya': { periods: { '3 oy': 11, '6 oy': 29, '12 oy': 44 } },
  'InTend': { periods: { '3 oy': 10, '6 oy': 20, '12 oy': 30 } },
  'alif nasiya': { periods: { '1 oy': 27, '3 oy': 37, '6 oy': 26, '9 oy': 44, '12 oy': 50, '15 oy': 62, '18 oy': 68, '24 oy': 87 } },
  'IMAN pay': { periods: { '3 oy': 31, '6 oy': 41, '9 oy': 51, '12 oy': 58 } },
  'SOLFY': { periods: { '3 oy': 8 } },
  'OPEN': { periods: { '12 oy': 32 } },
  'BUYSENSE Nasiya': { periods: { '3 oy': 30, '6 oy': 48, '9 oy': 62, '12 oy': 77 } },
  'StarPower': { periods: { '3 oy': 25, '6 oy': 42, '9 oy': 57, '12 oy': 72 }, requiresDownPayment: true }
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
    bot.sendMessage(chatId, 'Iltimos, rasm va matnni joylang.');
  } else {
    bot.sendMessage(chatId, 'Siz administrator emassiz');
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
      bot.sendMessage(chatId, 'Iltimos, rasm va matnni joylang.');
    }
  } else if (partners[msg.text]) {
    // Partner selected
    userState[userId].partner = msg.text;
    bot.sendMessage(chatId, 'Summani kiriting:', {
      reply_markup: {
        keyboard: [...Object.keys(partners).map(partner => [partner]), ['Orqaga']],
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
      const partner = partners[userState[userId].partner];
      const periods = partner.periods;
      let resultText = 'Rassrochka hisob-kitoblari:\n';

      for (let period in periods) {
        const margin = periods[period];
        if (partner.requiresDownPayment) {
          // Special calculation for StarPower
          const { totalAmount, downPayment, monthlyInstallment } = calculateInstallmentWithDownPayment(amount, margin, period);
          resultText += `${period}: Umumiy summa: ${totalAmount} so'm, Boshlang'ich to'lov: ${downPayment} so'm, Oyiga: ${monthlyInstallment} so'm\n`;
        } else {
          // Regular calculation for other partners
          const installment = calculateInstallment(amount, margin, parseInt(period));
          resultText += `${period}: ${installment} so'mdan\n`;
        }
      }
      bot.sendMessage(chatId, resultText, {
        reply_markup: {
          keyboard: [...Object.keys(partners).map(partner => [partner]), ['Orqaga']],
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
    return amount * 0.21;
  } else if (amount <= 8000000) {
    return amount * 0.16;
  } else {
    return amount * 0.11;
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

function calculateInstallmentWithDownPayment(amount, partnerMargin, period) {
  const totalWithMargin = amount * (1 + partnerMargin / 100);
  const downPayment = totalWithMargin * 0.25;
  const remainingAmount = totalWithMargin - downPayment;
  const monthlyInstallment = remainingAmount / parseInt(period);
  return {
    totalAmount: formatCurrency(totalWithMargin.toFixed(2)),
    downPayment: formatCurrency(downPayment.toFixed(2)),
    monthlyInstallment: formatCurrency(monthlyInstallment.toFixed(2)),
  };
}

bot.on('polling_error', (error) => {
  console.log(error);
});
