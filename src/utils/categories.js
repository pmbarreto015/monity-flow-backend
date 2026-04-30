const categories = {
  food: {
    keywords: ['mercado', 'comida', 'ifood', 'lanche', 'pizza', 'restaurante', 'hamburguer', 'sushi', 'padaria', 'feira'],
    type: 'expense',
    name: 'Alimentação'
  },
  transport: {
    keywords: ['uber', 'taxi', '99', 'ônibus', 'metrô', 'trem', 'combustível', 'gasolina', 'estacionamento'],
    type: 'expense',
    name: 'Transporte'
  },
  housing: {
    keywords: ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'iptu', 'seguro'],
    type: 'expense',
    name: 'Moradia'
  },
  leisure: {
    keywords: ['cinema', 'show', 'festa', 'bar', 'cerveja', 'netflix', 'spotify', 'jogo', 'steam'],
    type: 'expense',
    name: 'Lazer'
  },
  health: {
    keywords: ['farmácia', 'médico', 'dentista', 'exame', 'plano de saúde', 'hospital'],
    type: 'expense',
    name: 'Saúde'
  },
  education: {
    keywords: ['faculdade', 'curso', 'livro', 'material', 'escola', 'universidade'],
    type: 'expense',
    name: 'Educação'
  },
  salary: {
    keywords: ['salário', 'empresa', 'trabalho', 'recebi', 'depósito', 'pagamento', 'freela', 'extra'],
    type: 'income',
    name: 'Salário'
  },
  other: {
    keywords: [],
    type: 'expense',
    name: 'Outros'
  }
};

function detectCategory(text) {
  const lowerText = text.toLowerCase();
  for (const [category, data] of Object.entries(categories)) {
    for (const keyword of data.keywords) {
      if (lowerText.includes(keyword)) return category;
    }
  }
  return 'other';
}

function detectType(text) {
  const lowerText = text.toLowerCase();
  const incomeWords = ['recebi', 'salário', 'ganhei', 'depósito', 'entrada', '+'];
  const expenseWords = ['gastei', 'paguei', 'comprei', 'gasto', '-'];
  for (const word of incomeWords) {
    if (lowerText.includes(word)) return 'income';
  }
  for (const word of expenseWords) {
    if (lowerText.includes(word)) return 'expense';
  }
  return 'expense';
}

function extractAmount(text) {
  const patterns = [
    /(\d+(?:[.,]\d{2})?)/,
    /(\d+)\s*reais?/i,
    /(\d+)\s*R\$\s*(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }
  return null;
}

function extractDescription(text) {
  const ignoreWords = ['gastei', 'recebi', 'comprei', 'paguei', 'de', 'em', 'no', 'na', 'para'];
  const words = text.split(' ');
  for (const word of words) {
    const cleanWord = word.toLowerCase();
    if (!ignoreWords.includes(cleanWord) && word.length > 2 && !/^\d+$/.test(word) && !/^r?\$/.test(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  return 'Transação';
}

module.exports = { categories, detectCategory, detectType, extractAmount, extractDescription };