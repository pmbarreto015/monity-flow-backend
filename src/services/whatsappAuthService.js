const { db } = require('../config/firebase');
const WhatsAppService = require('./whatsappService');

class WhatsAppAuthService {
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationCode(phoneNumber, code) {
    const message = `🔐 *MONITY FLOW - CÓDIGO DE VERIFICAÇÃO*
Seu código é: *${code}*
Válido por 5 minutos.`;
    return await WhatsAppService.sendMessage(phoneNumber, message);
  }

  async saveVerificationCode(userId, code, phoneNumber) {
    await db.collection('users').doc(userId).collection('verification').doc('current').set({
      code: code,
      phoneNumber: phoneNumber,
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false
    });
  }

  async verifyCode(userId, enteredCode) {
    const doc = await db.collection('users').doc(userId).collection('verification').doc('current').get();
    if (!doc.exists) return false;
    
    const data = doc.data();
    if (data.verified) return false;
    if (Date.now() > data.expiresAt) return false;
    if (data.code !== enteredCode) return false;
    
    await db.collection('users').doc(userId).update({
      whatsapp: data.phoneNumber,
      whatsappVerified: true
    });
    
    await doc.ref.update({ verified: true });
    return true;
  }

  async getUserWhatsApp(userId) {
    const doc = await db.collection('users').doc(userId).get();
    return doc.data()?.whatsapp || null;
  }
}

module.exports = new WhatsAppAuthService();