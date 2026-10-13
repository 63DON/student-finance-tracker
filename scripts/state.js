export const defaultCategories = ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"];

export function createDefaultSettings() {
  return {
    baseCurrency: "USD",
    otherCurrencies: [
      { code: "RWF", rate: 1450 },
      { code: "EUR", rate: 0.92 }
    ],
    displayCurrency: "USD",
    budgetCap: null,
    categories: [...defaultCategories],
    theme: null
  };
}

const state = {
  records: [],
  settings: createDefaultSettings(),
  nextId: 1
};

const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
}

function notify(change) {
  for (const listener of listeners) {
    listener(state, change);
  }
}

function formatId(number) {
  return "txn_" + String(number).padStart(4, "0");
}

export function addRecord(fields) {
  const timestamp = new Date().toISOString();
  const record = {
    id: formatId(state.nextId),
    description: fields.description,
    amount: fields.amount,
    category: fields.category,
    date: fields.date,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  state.nextId += 1;
  state.records.push(record);
  notify({ type: "add", id: record.id });
  return record;
}
