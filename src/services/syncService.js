const { db } = require('../config/firebase');
const pluggyService = require('./pluggyService');

// Mapeamento de categorias Pluggy para o app
const CATEGORY_MAP = {
  'FOOD': 'Alimentação',
  'FOOD_AND_DRINK': 'Alimentação',
  'MEAL': 'Alimentação',
  'RESTAURANT': 'Alimentação',
  'GROCERIES': 'Alimentação',
  'TRANSPORT': 'Transporte',
  'TAXI': 'Transporte',
  'UBER': 'Transporte',
  'HOUSING': 'Moradia',
  'RENT': 'Moradia',
  'LEISURE': 'Lazer',
  'ENTERTAINMENT': 'Lazer',
  'HEALTH': 'Saúde',
  'PHARMACY': 'Saúde',
  'EDUCATION': 'Educação',
  'SALARY': 'Salário',
  'INCOME': 'Salário',
  'DEPOSIT': 'Salário',
  'BILLS': 'Contas',
  'UTILITIES': 'Contas'
};

function mapCategory(pluggyCategory) {
  return CATEGORY_MAP[pluggyCategory] || 'Outros';
}

async function syncTransactions(userId, itemId) {
  try {
    console.log(`🔄 Sincronizando usuário ${userId}, item ${itemId}`);
    
    const accounts = await pluggyService.getAccounts(itemId);
    let added = 0;
    let skipped = 0;

    const userDoc = await db.collection('users').doc(userId).get();
    const lastSyncDate = userDoc.data()?.lastBankSync || null;

    for (const account of accounts) {
      console.log(`📊 Processando conta: ${account.name} (${account.bank})`);
      
      const transactions = await pluggyService.getTransactions(account.id, lastSyncDate);
      
      for (const t of transactions) {
        // Verificar duplicata
        const existing = await db
          .collection('users')
          .doc(userId)
          .collection('transacoes')
          .where('pluggyId', '==', t.id)
          .limit(1)
          .get();

        if (!existing.empty) {
          skipped++;
          continue;
        }

        const transaction = {
          userId: userId,
          descricao: t.description || t.merchant?.name || 'Transação bancária',
          valor: Math.abs(t.amount),
          tipo: t.amount > 0 ? 'entrada' : 'saida',
          categoria: mapCategory(t.category),
          data: t.date,
          origem: 'banco',
          pluggyId: t.id,
          accountId: account.id,
          bankName: account.bank,
          createdAt: new Date().toISOString()
        };

        await db
          .collection('users')
          .doc(userId)
          .collection('transacoes')
          .add(transaction);
        
        added++;
      }

      // Atualizar saldo da conta
      const balance = await pluggyService.getAccountBalance(account.id);
      await db
        .collection('users')
        .doc(userId)
        .collection('bank_accounts')
        .doc(account.id)
        .set({
          bankName: account.bank,
          accountName: account.name,
          accountNumber: account.accountNumber || '****',
          balance: balance,
          lastSync: new Date().toISOString(),
          pluggyItemId: itemId
        }, { merge: true });
    }

    await db.collection('users').doc(userId).update({
      lastBankSync: new Date().toISOString(),
      bankConnected: true,
      bankItemId: itemId
    });

    console.log(`✅ Sincronização concluída: +${added} novas, ${skipped} duplicadas`);
    return { added, skipped };
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    throw error;
  }
}

module.exports = { syncTransactions };