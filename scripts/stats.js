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

export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

export function lastSevenDays(records, today = new Date()) {
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const date = toIsoDate(day);
    days.push({
      date,
      label: day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
      total: totalSpent(records.filter((record) => record.date === date))
    });
  }
  return days;
}

export function capStatus(total, cap) {
  if (cap === null) {
    return { state: "none", difference: 0 };
  }
  const difference = Math.round((cap - total) * 100) / 100;
  if (difference < 0) {
    return { state: "over", difference: -difference };
  }
  return { state: "under", difference };
}
