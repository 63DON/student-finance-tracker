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

export function updateSettings(changes) {
  Object.assign(state.settings, changes);
  notify({ type: "settings" });
}

function highestIdNumber(records) {
  return records.reduce((highest, record) => Math.max(highest, Number(record.id.slice(4))), 0);
}

export function hydrate(data) {
  state.records = data.records;
  state.settings = { ...createDefaultSettings(), ...data.settings };
  state.nextId = Math.max(data.nextId, highestIdNumber(data.records) + 1);
  notify({ type: "load" });
}

function adoptRecords(records) {
  state.nextId = Math.max(state.nextId, highestIdNumber(records) + 1);
  for (const record of records) {
    if (!state.settings.categories.includes(record.category)) {
      state.settings.categories.push(record.category);
    }
  }
}

export function replaceRecords(records) {
  state.records = records.map((record) => ({ ...record }));
  adoptRecords(records);
  notify({ type: "replace" });
}

export function deleteRecord(id) {
  state.records = state.records.filter((record) => record.id !== id);
  notify({ type: "delete", id });
}

export function updateRecord(id, changes) {
  const record = state.records.find((entry) => entry.id === id);
  Object.assign(record, changes, { updatedAt: new Date().toISOString() });
  notify({ type: "update", id });
  return record;
}

export function mergeRecords(records) {
  for (const incoming of records) {
    const index = state.records.findIndex((record) => record.id === incoming.id);
    if (index === -1) {
      state.records.push({ ...incoming });
    } else {
      state.records[index] = { ...incoming };
    }
  }
  adoptRecords(records);
  notify({ type: "merge" });
}

export function addCategory(name) {
  state.settings.categories.push(name);
  notify({ type: "categories" });
}

export function renameCategory(oldName, newName) {
  const timestamp = new Date().toISOString();
  let updatedCount = 0;
  state.settings.categories = state.settings.categories.map((name) => (name === oldName ? newName : name));
  for (const record of state.records) {
    if (record.category === oldName) {
      record.category = newName;
      record.updatedAt = timestamp;
      updatedCount += 1;
    }
  }
  notify({ type: "categories" });
  return updatedCount;
}

export function removeCategory(name) {
  state.settings.categories = state.settings.categories.filter((existing) => existing !== name);
  notify({ type: "categories" });
}

export function clearAll() {
  state.records = [];
  state.settings = { ...createDefaultSettings(), theme: state.settings.theme };
  notify({ type: "clear" });
}
