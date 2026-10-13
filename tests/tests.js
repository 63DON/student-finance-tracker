import {
  collapseSpaces,
  validateDescription,
  validateAmount,
  validateDate,
  validateCategory,
  validateExchangeRate,
  validateBudgetCap,
  validateCurrencyCode,
  findDuplicateWord
} from "../scripts/validators.js";

const results = [];
let currentGroup = "";

function group(name, body) {
  currentGroup = name;
  body();
}

function check(description, actual, expected) {
  const passed = Object.is(actual, expected);
  const detail = passed
    ? ""
    : " (expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual) + ")";
  results.push({ group: currentGroup, description, passed, detail });
}

function accepts(validate, value) {
  check("accepts " + JSON.stringify(value), validate(value).valid, true);
}

function rejects(validate, value) {
  check("rejects " + JSON.stringify(value), validate(value).valid, false);
}

function renderResults() {
  const container = document.querySelector("#testResults");
  const groupNames = [...new Set(results.map((result) => result.group))];
  for (const name of groupNames) {
    const heading = document.createElement("h3");
    heading.textContent = name;
    const list = document.createElement("ul");
    list.className = "test-list";
    for (const result of results.filter((entry) => entry.group === name)) {
      const item = document.createElement("li");
      item.className = result.passed ? "test-pass" : "test-fail";
      item.textContent = (result.passed ? "Pass: " : "Fail: ") + result.description + result.detail;
      list.append(item);
    }
    container.append(heading, list);
  }
  const failed = results.filter((result) => !result.passed).length;
  const summary = document.querySelector("#testSummary");
  summary.textContent = failed === 0
    ? "All " + results.length + " tests passed."
    : failed + " of " + results.length + " tests failed.";
  summary.classList.toggle("status-problem", failed > 0);
}

group("Description", () => {
  accepts(validateDescription, "Lunch");
  accepts(validateDescription, "Coffee with Sam");
  accepts(validateDescription, "a");
  rejects(validateDescription, "");
  rejects(validateDescription, " Lunch");
  rejects(validateDescription, "Lunch ");
  rejects(validateDescription, "   ");
  check("collapses double spaces", collapseSpaces("Bus   fare  home"), "Bus fare home");
});

group("Amount", () => {
  for (const value of ["0", "12", "12.5", "12.50", "0.01", "99999.99"]) {
    accepts(validateAmount, value);
  }
  for (const value of ["", "01", "12.", ".5", "12.505", "-3", "1,000", "1e3", "abc"]) {
    rejects(validateAmount, value);
  }
});

group("Date", () => {
  for (const value of ["2025-09-29", "2024-02-29", "2025-12-31", "2025-01-01"]) {
    accepts(validateDate, value);
  }
  for (const value of ["", "2025-02-30", "2023-02-29", "2025-04-31", "2025-13-01", "2025-00-10", "2025-1-5", "29-09-2025"]) {
    rejects(validateDate, value);
  }
});

group("Category", () => {
  for (const value of ["Food", "Study Group", "Take-away"]) {
    accepts(validateCategory, value);
  }
  for (const value of ["", "Food2", " Food", "Food ", "Food  Drinks", "Food-", "Fees!"]) {
    rejects(validateCategory, value);
  }
});

group("Duplicate word (back-reference)", () => {
  check("finds a repeated word", findDuplicateWord("paid for the the bus"), "the");
  check("ignores case when comparing", findDuplicateWord("Coffee coffee again"), "Coffee");
  check("does not flag a word that only starts the same", findDuplicateWord("the theme park"), null);
  check("returns null when nothing repeats", findDuplicateWord("bus fare home"), null);
});

group("Exchange rate (lookahead)", () => {
  for (const value of ["1", "0.5", "1450", "0.0001", "10.25"]) {
    accepts(validateExchangeRate, value);
  }
  for (const value of ["", "0", "0.00", "0.0000", "1.23456", ".5", "-1", "abc"]) {
    rejects(validateExchangeRate, value);
  }
});

group("Budget cap and currency code", () => {
  accepts(validateBudgetCap, "");
  accepts(validateBudgetCap, "500");
  accepts(validateBudgetCap, "0");
  rejects(validateBudgetCap, "5.555");
  rejects(validateBudgetCap, "lots");
  accepts(validateCurrencyCode, "USD");
  accepts(validateCurrencyCode, "RWF");
  rejects(validateCurrencyCode, "usd");
  rejects(validateCurrencyCode, "US");
  rejects(validateCurrencyCode, "USDT");
});

renderResults();
