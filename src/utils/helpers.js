class FinancialHelpers {
  static calcularSaldo(transacoes) {
    let saldo = 0;
    for (const t of transacoes) {
      if (t.tipo === 'entrada') {
        saldo += t.valor;
      } else {
        saldo -= t.valor;
      }
    }
    return saldo;
  }

  static calcularGastosPorCategoria(transacoes) {
    const gastos = {};
    for (const t of transacoes) {
      if (t.tipo === 'saida') {
        const categoria = t.categoria || 'Outros';
        gastos[categoria] = (gastos[categoria] || 0) + t.valor;
      }
    }
    return gastos;
  }

  static calcularMediaDiaria(transacoes, dias = 30) {
    const saidas = transacoes.filter(t => t.tipo === 'saida');
    if (saidas.length === 0) return 0;
    const total = saidas.reduce((sum, t) => sum + t.valor, 0);
    return total / dias;
  }

  static preverSaldoFinal(saldoAtual, mediaGastosDiaria, diasRestantes) {
    const gastoPrevisto = mediaGastosDiaria * diasRestantes;
    return saldoAtual - gastoPrevisto;
  }

  static getMaiorGasto(transacoes) {
    const saidas = transacoes.filter(t => t.tipo === 'saida');
    if (saidas.length === 0) return null;
    return saidas.reduce((max, t) => t.valor > max.valor ? t : max, saidas[0]);
  }

  static getCategoriaMaisGasta(gastosPorCategoria) {
    let maxCat = null;
    let maxVal = 0;
    for (const [cat, val] of Object.entries(gastosPorCategoria)) {
      if (val > maxVal) {
        maxVal = val;
        maxCat = cat;
      }
    }
    return { categoria: maxCat, valor: maxVal };
  }

  static formatCurrency(value) {
    return `R$ ${(value || 0).toFixed(2).replace('.', ',')}`;
  }

  static getDiasRestantesNoMes() {
    const hoje = new Date();
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return ultimoDia.getDate() - hoje.getDate();
  }
}

module.exports = FinancialHelpers;