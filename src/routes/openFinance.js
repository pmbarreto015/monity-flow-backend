const express = require('express');
const router = express.Router();
const { createConnectToken } = require('../services/pluggyService');
const { syncTransactions } = require('../services/syncService');
const { db } = require('../config/firebase');

// Criar connect token para abrir o widget do Pluggy
router.post('/connect-token', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    
    const data = await createConnectToken(userId);
    res.json({ 
      success: true, 
      connectToken: data.accessToken,
      expiresAt: data.expiresAt
    });
  } catch (err) {
    console.error('Erro no connect-token:', err);
    res.status(500).json({ error: 'Erro ao conectar com o banco. Tente novamente.' });
  }
});

// Sincronizar transações manualmente
router.post('/sync', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    
    const userDoc = await db.collection('users').doc(userId).get();
    const itemId = userDoc.data()?.bankItemId;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Nenhum banco conectado. Conecte um banco primeiro.' });
    }
    
    const result = await syncTransactions(userId, itemId);
    res.json({ 
      success: true, 
      added: result.added, 
      skipped: result.skipped,
      message: `Sincronização concluída: ${result.added} novas transações`
    });
  } catch (err) {
    console.error('Erro na sincronização:', err);
    res.status(500).json({ error: 'Erro ao sincronizar transações' });
  }
});

// Verificar status da conexão bancária
router.get('/status/:userId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.userId).get();
    const data = userDoc.data();
    
    res.json({
      bankConnected: data?.bankConnected || false,
      bankItemId: data?.bankItemId || null,
      bankName: data?.bankName || null,
      lastBankSync: data?.lastBankSync || null
    });
  } catch (err) {
    console.error('Erro ao verificar status:', err);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

// Desconectar banco
router.delete('/disconnect/:userId', async (req, res) => {
  try {
    await db.collection('users').doc(req.params.userId).update({
      bankConnected: false,
      bankItemId: null,
      bankName: null,
      lastBankSync: null
    });
    res.json({ success: true, message: 'Banco desconectado com sucesso' });
  } catch (err) {
    console.error('Erro ao desconectar:', err);
    res.status(500).json({ error: 'Erro ao desconectar banco' });
  }
});

module.exports = router;