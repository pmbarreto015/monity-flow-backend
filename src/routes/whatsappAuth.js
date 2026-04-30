const express = require('express');
const router = express.Router();
const wwebjsService = require('../services/wwebjsService');
const { db } = require('../config/firebase');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/request-code', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    
    if (!userId || !phoneNumber) {
      return res.status(400).json({ error: 'userId e phoneNumber obrigatórios' });
    }
    
    const code = generateCode();
    const message = `🔐 *MONITY FLOW*\n\nSeu código de verificação é: *${code}*\n\nVálido por 5 minutos.`;
    
    const sent = await wwebjsService.sendMessageToNumber(phoneNumber, message);
    
    if (!sent) {
      return res.status(500).json({ error: 'Erro ao enviar código' });
    }
    
    await db.collection('users').doc(userId).set({
      whatsapp: phoneNumber,
      whatsappVerified: false,
      verificationCode: code,
      verificationCodeExpiresAt: Date.now() + 5 * 60 * 1000,
    }, { merge: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const data = userDoc.data();
    const savedCode = data.verificationCode;
    const expiresAt = data.verificationCodeExpiresAt;
    
    if (!savedCode || Date.now() > expiresAt) {
      return res.status(400).json({ error: 'Código expirado' });
    }
    
    if (savedCode !== code) {
      return res.status(400).json({ error: 'Código inválido' });
    }
    
    await db.collection('users').doc(userId).update({
      whatsappVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/status/:userId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.userId).get();
    const whatsappStatus = wwebjsService.getStatus();
    
    res.json({
      connected: userDoc.data()?.whatsappVerified || false,
      botConnected: whatsappStatus.connected,
      whatsapp: userDoc.data()?.whatsapp || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;