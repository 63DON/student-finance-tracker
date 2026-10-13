const storageKey = "studentFinanceTracker";

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExpectedShape(data) {
  return isPlainObject(data)
    && Array.isArray(data.records)
    && isPlainObject(data.settings)
    && Array.isArray(data.settings.categories)
    && Array.isArray(data.settings.otherCurrencies)
    && Number.isInteger(data.nextId);
}

export function loadData() {
  try {
    const text = localStorage.getItem(storageKey);
    if (text === null) {
      return { status: "empty", data: null };
    }
    const data = JSON.parse(text);
    if (!hasExpectedShape(data)) {
      return { status: "corrupted", data: null };
    }
    return { status: "ok", data };
  } catch {
    return { status: "corrupted", data: null };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
