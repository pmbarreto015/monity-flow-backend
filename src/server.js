require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Serviços
const wwebjsService = require('./services/wwebjsService');

// Rotas
const openFinanceRoutes = require('./routes/openFinance');
const pluggyWebhookRoutes = require('./routes/pluggyWebhook');
const whatsappAuthRoutes = require('./routes/whatsappAuth');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'https://monity-flow-backend.onrender.com';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROTAS ====================

app.use('/open-finance', openFinanceRoutes);
app.use('/pluggy', pluggyWebhookRoutes);
app.use('/whatsapp-auth', whatsappAuthRoutes);

app.get('/whatsapp/status', (req, res) => {
  const status = wwebjsService.getStatus();
  res.json({
    connected: status.connected,
    message: status.connected ? 'Bot conectado' : 'Bot desconectado'
  });
});

app.get('/config', (req, res) => {
  res.json({
    backendUrl: BASE_URL,
    endpoints: {
      whatsappAuth: `${BASE_URL}/whatsapp-auth`,
      openFinance: `${BASE_URL}/open-finance`,
      pluggyWebhook: `${BASE_URL}/pluggy/webhook`
    }
  });
});

app.get('/status', (req, res) => {
  const whatsappStatus = wwebjsService.getStatus();
  res.json({
    server: 'online',
    version: '2.0.0',
    renderUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    services: {
      firebase: !!process.env.FIREBASE_PROJECT_ID,
      openFinance: !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_ID !== 'seu_client_id'),
      whatsapp: whatsappStatus.connected,
      gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'SUA_CHAVE_API_AQUI')
    }
  });
});

app.get('/', (req, res) => {
  const whatsappStatus = wwebjsService.getStatus();
  res.json({
    name: 'Monity Flow Backend',
    version: '2.0.0',
    status: 'online',
    renderUrl: BASE_URL,
    services: {
      whatsapp: whatsappStatus.connected,
      openFinance: !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_ID !== 'seu_client_id'),
      gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'SUA_CHAVE_API_AQUI')
    },
    endpoints: {
      status: 'GET /status',
      config: 'GET /config',
      openFinance: 'POST /open-finance/connect-token',
      pluggyWebhook: 'POST /pluggy/webhook',
      whatsappAuth: 'POST /whatsapp-auth/request-code',
      whatsappStatus: 'GET /whatsapp/status'
    }
  });
});

// ==================== INICIAR ====================

wwebjsService.initialize().catch(err => {
  console.error('⚠️ WhatsApp Bot não iniciado:', err.message);
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   🚀 MONITY FLOW BACKEND - RENDER                                    ║
║                                                                      ║
║   🌍 URL: ${BASE_URL}                                          ║
║                                                                      ║
║   ✅ Firebase: ${process.env.FIREBASE_PROJECT_ID ? 'Conectado' : 'Não configurado'}                           ║
║   ✅ Open Finance: ${process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_ID !== 'seu_client_id' ? 'Configurado' : 'Aguardando'}                ║
║   ✅ WhatsApp Bot: ${wwebjsService.getStatus().connected ? 'Conectado' : 'Aguardando QR Code'}                 ║
║   ✅ Gemini IA: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'SUA_CHAVE_API_AQUI' ? 'Configurada' : 'Não configurada'}                       ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promise rejeitada:', reason);
});

module.exports = { app, server };