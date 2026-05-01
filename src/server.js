require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar rotas
const openFinanceRoutes = require('./routes/openFinance');
const pluggyWebhookRoutes = require('./routes/pluggyWebhook');
const whatsappAuthRoutes = require('./routes/whatsappAuth');

// Importar serviços
let wwebjsService = null;
try {
  wwebjsService = require('./services/wwebjsService');
} catch (error) {
  console.log('⚠️ WhatsApp Service não disponível');
}

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.RENDER_URL || process.env.RAILWAY_URL || `http://localhost:${PORT}`;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== OPEN FINANCE (PLUGGY) ====================
app.use('/open-finance', openFinanceRoutes);

// ==================== PLUGGY WEBHOOK ====================
app.use('/pluggy', pluggyWebhookRoutes);

// ==================== WHATSAPP AUTH ====================
app.use('/whatsapp-auth', whatsappAuthRoutes);

// ==================== WHATSAPP BOT STATUS ====================
app.get('/whatsapp/status', (req, res) => {
  if (wwebjsService && wwebjsService.getStatus) {
    const status = wwebjsService.getStatus();
    res.json({ 
      connected: status.connected,
      message: status.connected ? 'Bot conectado' : 'Bot desconectado'
    });
  } else {
    res.json({ connected: false, message: 'WhatsApp Bot não disponível' });
  }
});

// ==================== CONFIGURAÇÃO PARA FLUTTER ====================
app.get('/config', (req, res) => {
  res.json({
    backendUrl: BASE_URL,
    endpoints: {
      status: `${BASE_URL}/status`,
      health: `${BASE_URL}/health`,
      openFinance: `${BASE_URL}/open-finance`,
      pluggyWebhook: `${BASE_URL}/pluggy/webhook`,
      whatsappAuth: `${BASE_URL}/whatsapp-auth`,
      whatsappStatus: `${BASE_URL}/whatsapp/status`
    }
  });
});

// ==================== STATUS DO SERVIDOR ====================
app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    version: '2.0.0',
    url: BASE_URL,
    timestamp: new Date().toISOString(),
    services: {
      firebase: true,
      openFinance: !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_ID !== 'seu_client_id'),
      gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'sua_chave_aqui'),
      whatsapp: wwebjsService ? (wwebjsService.getStatus()?.connected || false) : false
    }
  });
});

// ==================== ROTA RAIZ ====================
app.get('/', (req, res) => {
  res.json({
    name: 'Monity Flow Backend',
    version: '2.0.0',
    status: 'online',
    description: 'API para Monity Flow App',
    endpoints: {
      health: 'GET /health',
      status: 'GET /status',
      config: 'GET /config',
      openFinance: {
        connectToken: 'POST /open-finance/connect-token',
        sync: 'POST /open-finance/sync',
        status: 'GET /open-finance/status/:userId',
        disconnect: 'DELETE /open-finance/disconnect/:userId'
      },
      pluggyWebhook: 'POST /pluggy/webhook',
      whatsappAuth: {
        requestCode: 'POST /whatsapp-auth/request-code',
        verifyCode: 'POST /whatsapp-auth/verify-code',
        status: 'GET /whatsapp-auth/status/:userId'
      },
      whatsappBot: {
        status: 'GET /whatsapp/status'
      }
    }
  });
});

// ==================== INICIAR SERVIDOR ====================

// Iniciar WhatsApp Bot (se disponível)
if (wwebjsService && wwebjsService.initialize) {
  setTimeout(() => {
    wwebjsService.initialize().catch(err => {
      console.error('⚠️ WhatsApp Bot não iniciado:', err.message);
    });
  }, 5000);
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   🚀 MONITY FLOW BACKEND - RAILWAY                                   ║
║                                                                      ║
║   🌍 URL: ${BASE_URL}                                                ║
║   📡 Porta: ${PORT}                                                  ║
║                                                                      ║
║   ✅ Firebase: Conectado                                             ║
║   ✅ Open Finance: ${process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_ID !== 'seu_client_id' ? 'Configurado' : 'Aguardando'}
║   ✅ Gemini IA: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'sua_chave_aqui' ? 'Configurada' : 'Aguardando'}
║                                                                      ║
║   📱 ENDPOINTS DISPONÍVEIS:                                          ║
║   • GET  /status                                                     ║
║   • GET  /config                                                     ║
║   • POST /open-finance/connect-token                                 ║
║   • POST /pluggy/webhook                                             ║
║   • POST /whatsapp-auth/request-code                                 ║
║   • POST /whatsapp-auth/verify-code                                  ║
║   • GET  /whatsapp/status                                            ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promise rejeitada:', reason);
});

module.exports = { app };