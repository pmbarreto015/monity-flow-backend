const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { syncTransactions } = require('../services/syncService');
const { getItem } = require('../services/pluggyService');

router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event, data } = req.body;
    console.log(`📨 Pluggy webhook: ${event}`);

    if (event === "item/created" || event === "item/updated") {
      const itemId = data.id;
      const userId = data.clientUserId;

      // Buscar informações do item (banco conectado)
      const item = await getItem(itemId);

      // Salvar itemId no Firestore
      await db.collection('users').doc(userId).set({
        bankItemId: itemId,
        bankConnected: true,
        bankName: item.connector?.name || item.bank || 'Banco',
        lastBankSync: new Date().toISOString()
      }, { merge: true });

      // Sincronizar transações
      await syncTransactions(userId, itemId);
      
      console.log(`✅ Banco ${item.bank || 'conectado'} sincronizado para usuário ${userId}`);
    }

    if (event === "item/deleted") {
      const userId = data.clientUserId;
      await db.collection('users').doc(userId).update({
        bankConnected: false,
        bankItemId: null,
        bankName: null
      });
      console.log(`🗑️ Banco desconectado para usuário ${userId}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
});

module.exports = router;