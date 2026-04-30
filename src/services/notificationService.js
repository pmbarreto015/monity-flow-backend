const { db } = require('../config/firebase');
const FinancialHelpers = require('../utils/helpers');
const WhatsAppService = require('./whatsappService');

class NotificationService {
  constructor() {
    this.dailyCheckInterval = null;
  }

  start() {
    this.dailyCheckInterval = setInterval(() => this.processDailyChecks(), 24 * 60 * 60 * 1000);
    console.log('✅ NotificationService iniciado');
  }

  async processDailyChecks() {
    try {
      const users = await db.collection('users').where('whatsappVerified', '==', true).get();
      for (const userDoc of users.docs) {
        const user = userDoc.data();
        const phoneNumber = user.whatsapp;
        if (phoneNumber) {
          await this.sendDailySummary(phoneNumber, userDoc.id);
          await this.checkHighSpending(phoneNumber, userDoc.id);
          await this.checkNegativePrediction(phoneNumber, userDoc.id);
        }
      }
    } catch (error) {
      console.error('Erro nos checks diários:', error);
    }
  }

  async getUserData(userId) {
    try {
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
      
      const trxQuery = await db
        .collection('users')
        .doc(userId)
        .collection('transacoes')
        .where('data', '>=', inicioHoje.toISOString())
        .where('data', '<', fimHoje.toISOString())
        .get();
      
      const gastosHoje = trxQuery.docs
        .filter(doc => doc.data().tipo === 'saida')
        .reduce((sum, doc) => sum + doc.data().valor, 0);
      
      return { gastosHoje };
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      return null;
    }
  }

  async sendDailySummary(phoneNumber, userId) {
    try {
      const userData = await this.getUserData(userId);
      if (!userData) return;
      
      const message = `🌅 *Bom dia! Seu resumo do dia*
📊 *Gastos de hoje:* ${FinancialHelpers.formatCurrency(userData.gastosHoje)}
---
Monity Flow - Seu dinheiro no caminho certo`;
      await WhatsAppService.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Erro ao enviar resumo:', error);
    }
  }

  async checkHighSpending(phoneNumber, userId) {
    try {
      const userData = await this.getUserData(userId);
      if (!userData || userData.gastosHoje === 0) return;
      
      if (userData.gastosHoje > 200) {
        const message = `⚠️ *Alerta de gastos!*
Hoje você já gastou *${FinancialHelpers.formatCurrency(userData.gastosHoje)}*.`;
        await WhatsAppService.sendMessage(phoneNumber, message);
      }
    } catch (error) {
      console.error('Erro ao verificar gastos:', error);
    }
  }

  async checkNegativePrediction(phoneNumber, userId) {
    // Implementação simplificada
    return;
  }

  async sendCustomNotification(phoneNumber, message) {
    try {
      await WhatsAppService.sendMessage(phoneNumber, message);
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();