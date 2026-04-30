const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const geminiService = require('./geminiService');
const { db } = require('../config/firebase');

class WWebJSService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async initialize() {
    if (this.client) return this.client;
    
    try {
      console.log('🔄 Iniciando WhatsApp Bot...');

      // Configuração para o Render
      const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                         '/opt/render/project/src/.cache/puppeteer/chrome/linux/chrome';
      
      console.log(`🔍 Chrome path: ${chromePath}`);

      const puppeteerConfig = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ],
        executablePath: chromePath
      };

      this.client = new Client({
        authStrategy: new LocalAuth({ 
          clientId: 'monity-flow', 
          dataPath: './tokens' 
        }),
        puppeteer: puppeteerConfig
      });

      this.client.on('qr', (qr) => {
        console.log('\n========================================');
        console.log('📱 ESCANEIE O QR CODE COM SEU WHATSAPP:');
        console.log('========================================\n');
        qrcode.generate(qr, { small: true });
        console.log('\n========================================');
        console.log('⚠️ QR Code gerado! Escaneie no WhatsApp > WhatsApp Web');
        console.log('========================================\n');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('\n========================================');
        console.log('✅ WHATSAPP BOT CONECTADO COM SUCESSO!');
        console.log('========================================\n');
      });

      this.client.on('authenticated', () => {
        console.log('✅ WhatsApp autenticado');
      });

      this.client.on('message', async (message) => {
        await this.handleMessage(message);
      });

      await this.client.initialize();
      return this.client;
    } catch (error) {
      console.error('❌ Erro ao iniciar WWebJS:', error.message);
      return null;
    }
  }

  async handleMessage(message) {
    const from = message.from;
    const body = message.body;
    
    // Ignorar mensagens de grupo e status
    if (message.isGroupMsg || from === 'status@broadcast' || !body) return;

    console.log(`📨 Mensagem recebida de ${from}: ${body}`);

    // Buscar dados financeiros do usuário
    const userData = await this.getUserFinancialData(from);

    // Processar com IA Gemini
    const result = await geminiService.processMessage(body, userData);
    
    await this.sendMessage(from, result.response);
  }

  async getUserFinancialData(phoneNumber) {
    try {
      const userQuery = await db
        .collection('users')
        .where('whatsapp', '==', phoneNumber)
        .limit(1)
        .get();
        
      if (userQuery.empty) return null;
      
      const userId = userQuery.docs[0].id;
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      const transactions = await db
        .collection('users')
        .doc(userId)
        .collection('transacoes')
        .where('data', '>=', inicioMes.toISOString())
        .get();
      
      let saldo = 0;
      let entradas = 0;
      let gastos = 0;
      
      for (const doc of transactions.docs) {
        const t = doc.data();
        if (t.tipo === 'entrada') {
          saldo += t.valor;
          entradas += t.valor;
        } else {
          saldo -= t.valor;
          gastos += t.valor;
        }
      }
      
      return { 
        saldo, 
        entradas, 
        gastos, 
        userId,
        nome: userQuery.docs[0].data().nome || 'Usuário'
      };
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error.message);
      return null;
    }
  }

  async sendMessage(to, message) {
    try {
      if (!this.client || !this.isConnected) {
        console.log('⚠️ WhatsApp não conectado');
        return false;
      }
      
      const chat = await this.client.getChatById(to);
      await chat.sendMessage(message);
      console.log(`✅ Mensagem enviada para ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      return false;
    }
  }

  async sendVerificationCode(phoneNumber, code) {
    const message = `🔐 *MONITY FLOW*\n\nSeu código de verificação é: *${code}*\n\nVálido por 5 minutos.\n\nDigite este código no aplicativo para confirmar seu número.`;
    return await this.sendMessage(phoneNumber, message);
  }

  getStatus() {
    return { 
      connected: this.isConnected 
    };
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isConnected = false;
      console.log('🔌 WhatsApp Bot desconectado');
    }
  }
}

module.exports = new WWebJSService();