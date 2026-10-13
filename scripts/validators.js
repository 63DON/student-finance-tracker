export const patterns = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicateWord: /\b(\w+)\s+\1\b/i,
  exchangeRate: /^(?=.*[1-9])\d+(\.\d{1,4})?$/,
  currencyCode: /^[A-Z]{3}$/
};

function pass() {
  return { valid: true, message: "" };
}

function fail(message) {
  return { valid: false, message };
}

export function collapseSpaces(value) {
  return value.replace(/\s{2,}/g, " ");
}

export function validateDescription(value) {
  if (value === "") {
    return fail("Enter a description.");
  }
  if (!patterns.description.test(value)) {
    return fail("Remove the spaces at the start or end.");
  }
  return pass();
}

export function validateAmount(value) {
  if (value === "") {
    return fail("Enter an amount.");
  }
  if (!patterns.amount.test(value)) {
    return fail("Use digits with up to two decimals and no leading zeros, like 12.50.");
  }
  return pass();
}

export function isRealDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function validateDate(value) {
  if (value === "") {
    return fail("Enter a date.");
  }
  if (!patterns.date.test(value)) {
    return fail("Use the format YYYY-MM-DD, like 2025-09-29.");
  }
  if (!isRealDate(value)) {
    return fail("That day does not exist in the calendar.");
  }
  return pass();
}

export function validateCategory(value) {
  if (value === "") {
    return fail("Choose a category.");
  }
  if (!patterns.category.test(value)) {
    return fail("Use letters only, with single spaces or hyphens between words.");
  }
  return pass();
}

export function findDuplicateWord(value) {
  const match = value.match(patterns.duplicateWord);
  return match ? match[1] : null;
}

export function validateExchangeRate(value) {
  if (value === "") {
    return fail("Enter a rate.");
  }
  if (!patterns.exchangeRate.test(value)) {
    return fail("Use a number above zero with up to four decimals.");
  }
  return pass();
}

export function validateBudgetCap(value) {
  if (value === "") {
    return pass();
  }
  if (!patterns.amount.test(value)) {
    return fail("Use digits with up to two decimals, or leave it empty.");
  }
  return pass();
}

export function validateCurrencyCode(value) {
  if (!patterns.currencyCode.test(value)) {
    return fail("Use three capital letters, like USD.");
  }
  return pass();
}
