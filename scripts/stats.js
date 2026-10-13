export function totalSpent(records) {
  return records.reduce((sum, record) => sum + record.amount, 0);
}

export function topCategory(records) {
  const totals = new Map();
  for (const record of records) {
    totals.set(record.category, (totals.get(record.category) || 0) + record.amount);
  }
  let top = null;
  for (const [name, total] of totals) {
    if (top === null || total > top.total) {
      top = { name, total };
    }
  }
  return top;
}

export function convertAmount(amount, settings) {
  if (settings.displayCurrency === settings.baseCurrency) {
    return amount;
  }
  const other = settings.otherCurrencies.find((currency) => currency.code === settings.displayCurrency);
  return other ? amount * other.rate : amount;
}
