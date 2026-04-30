const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isAvailable = false;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'SUA_CHAVE_API_AQUI') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isAvailable = true;
      console.log('✅ Gemini AI inicializado');
    } else {
      console.log('⚠️ Gemini AI não configurado');
    }
  }

  async processMessage(message, userData = null) {
    if (!this.isAvailable) {
      return this.getLocalResponse(message, userData);
    }

    try {
      const prompt = this.buildPrompt(message, userData);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      return {
        success: true,
        response: response,
        usedAI: true
      };
    } catch (error) {
      console.error('❌ Erro Gemini:', error.message);
      return this.getLocalResponse(message, userData);
    }
  }

  buildPrompt(message, userData) {
    let prompt = `Você é o assistente financeiro do Monity Flow. Responda de forma natural, breve e útil em português.

Mensagem do usuário: "${message}"

REGRAS:
- Seja direto (máximo 2 frases)
- Use R$ para valores
- Seja amigável
- Se não entender, sugira "gastei 50 no mercado" ou "recebi 1500 salário"
`;

    if (userData) {
      prompt += `
DADOS DO USUÁRIO:
- Saldo: R$ ${userData.saldo || 0}
- Entradas do mês: R$ ${userData.entradas || 0}
- Gastos do mês: R$ ${userData.gastos || 0}
`;
    }

    return prompt;
  }

  getLocalResponse(message, userData) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('saldo')) {
      const saldo = userData?.saldo || 0;
      return {
        success: true,
        response: `💰 Seu saldo atual é R$ ${saldo.toFixed(2)}. ${saldo >= 0 ? 'Continue assim!' : 'Atenção! Reveja seus gastos.'}`,
        usedAI: false
      };
    }
    
    if (lowerMsg.includes('ajuda')) {
      return {
        success: true,
        response: `🤖 *COMANDOS*\n\n• "gastei 50 no mercado"\n• "recebi 1500 salário"\n• "saldo"\n• "ajuda"`,
        usedAI: false
      };
    }
    
    if (lowerMsg.includes('gastei') || lowerMsg.includes('paguei')) {
      return {
        success: true,
        response: `💸 *GASTO REGISTRADO!*\n\nContinue controlando suas finanças.`,
        usedAI: false
      };
    }
    
    if (lowerMsg.includes('recebi') || lowerMsg.includes('ganhei')) {
      return {
        success: true,
        response: `💰 *ENTRADA REGISTRADA!*\n\nContinue assim!`,
        usedAI: false
      };
    }
    
    return {
      success: true,
      response: `👋 *MONITY FLOW*\n\nDigite "ajuda" para ver os comandos disponíveis.`,
      usedAI: false
    };
  }
}

module.exports = new GeminiService();