const axios = require('axios');

const BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai';
const CLIENT_ID = process.env.PLUGGY_CLIENT_ID;
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET;

let apiKey = null;
let tokenExpiresAt = null;

async function authenticate() {
  try {
    console.log('🔐 Autenticando com Pluggy...');
    const response = await axios.post(`${BASE_URL}/auth`, {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
    apiKey = response.data.apiKey;
    tokenExpiresAt = Date.now() + (response.data.expiresIn * 1000);
    console.log('✅ Pluggy autenticado com sucesso');
    return apiKey;
  } catch (error) {
    console.error('❌ Erro Pluggy:', error.response?.data || error.message);
    throw error;
  }
}

async function getApiKey() {
  if (!apiKey || Date.now() >= tokenExpiresAt) {
    await authenticate();
  }
  return apiKey;
}

async function createConnectToken(userId) {
  const key = await getApiKey();
  const response = await axios.post(
    `${BASE_URL}/connect_token`,
    { clientUserId: userId },
    { headers: { Authorization: `Bearer ${key}` } }
  );
  console.log(`✅ Connect token criado para usuário: ${userId}`);
  return response.data;
}

async function getItem(itemId) {
  const key = await getApiKey();
  const response = await axios.get(
    `${BASE_URL}/items/${itemId}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  return response.data;
}

async function getAccounts(itemId) {
  const key = await getApiKey();
  const response = await axios.get(
    `${BASE_URL}/accounts?itemId=${itemId}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  return response.data.results || [];
}

async function getTransactions(accountId, fromDate = null) {
  const key = await getApiKey();
  let url = `${BASE_URL}/transactions?accountId=${accountId}&pageSize=100`;
  if (fromDate) {
    url += `&from=${fromDate}`;
  }
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${key}` }
  });
  return response.data.results || [];
}

async function getAccountBalance(accountId) {
  const key = await getApiKey();
  const response = await axios.get(
    `${BASE_URL}/accounts/${accountId}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  return response.data.balance || 0;
}

module.exports = {
  authenticate,
  getApiKey,
  createConnectToken,
  getItem,
  getAccounts,
  getTransactions,
  getAccountBalance
};