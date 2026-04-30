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

      // Caminho correto do Chrome no Render
      const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                         '/opt/render/project/src/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';
      
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

  // ... resto do código igual
}

module.exports = new WWebJSService();