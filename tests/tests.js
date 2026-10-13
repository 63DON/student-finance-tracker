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
import { compileRegex, filterRecords, sortRecords, escapeHtml, highlight } from "../scripts/search.js";
import { totalSpent, topCategory, lastSevenDays, toIsoDate, capStatus, convertAmount } from "../scripts/stats.js";
import { validateRecords, parseImport, summariseErrors, recordsToJson } from "../scripts/importExport.js";

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

group("Safe regex compiler", () => {
  check("returns a RegExp for a good pattern", compileRegex("coffee") instanceof RegExp, true);
  check("returns null for an unclosed group", compileRegex("(coffee"), null);
  check("returns null for an unclosed bracket", compileRegex("[a-"), null);
  check("returns null for a dangling quantifier", compileRegex("*tea"), null);
  check("returns null for an empty pattern", compileRegex(""), null);
  check("ignores case by default", compileRegex("coffee").test("COFFEE"), true);
  check("respects case when the flag is removed", compileRegex("coffee", "").test("COFFEE"), false);
});

group("Filtering and sorting", () => {
  const sample = [
    { id: "txn_0001", description: "Coffee beans", amount: 7.5, category: "Food", date: "2025-03-02", createdAt: "a" },
    { id: "txn_0002", description: "bus pass", amount: 20, category: "Transport", date: "2025-03-01", createdAt: "b" },
    { id: "txn_0003", description: "Tea", amount: 1.25, category: "Food", date: "2025-03-03", createdAt: "c" }
  ];
  const ids = (records) => records.map((record) => record.id.slice(-1)).join("");
  check("keeps every record when there is no pattern", filterRecords(sample, null).length, 3);
  check("matches descriptions", ids(filterRecords(sample, compileRegex("(coffee|tea)"))), "13");
  check("matches categories", ids(filterRecords(sample, compileRegex("^transport$"))), "2");
  check("sorts by date ascending", ids(sortRecords(sample, "date", "ascending")), "213");
  check("sorts by date descending", ids(sortRecords(sample, "date", "descending")), "312");
  check("sorts descriptions without caring about case", ids(sortRecords(sample, "description", "ascending")), "213");
  check("sorts by amount descending", ids(sortRecords(sample, "amount", "descending")), "213");
  check("leaves the original array alone", ids(sample), "123");
});

group("Highlight escaping", () => {
  check("wraps a match in mark", highlight("iced coffee", compileRegex("coffee")), "iced <mark>coffee</mark>");
  check("wraps every match", highlight("tea and tea", compileRegex("tea")), "<mark>tea</mark> and <mark>tea</mark>");
  check("escapes text when there is no pattern", highlight("<b>bold</b>", null), "&lt;b&gt;bold&lt;/b&gt;");
  check("escapes text around a match", highlight("<b>bold</b>", compileRegex("bold")), "&lt;b&gt;<mark>bold</mark>&lt;/b&gt;");
  check("escapes text inside a match", highlight("a<b", compileRegex("a<b")), "<mark>a&lt;b</mark>");
  check("escapes ampersands and quotes", escapeHtml("Tom & \"Jerry's\""), "Tom &amp; &quot;Jerry&#39;s&quot;");
  check("survives a pattern that matches nothing at all", highlight("abc", compileRegex("x*")), "abc");
  check("skips zero-length matches but keeps real ones", highlight("aab", compileRegex("a*")), "<mark>aa</mark>b");
  check("handles a lookahead that never consumes text", highlight("abc", compileRegex("(?=b)")), "abc");
});

group("Stats", () => {
  const sample = [
    { amount: 10, category: "Food", date: "2025-03-10" },
    { amount: 2.5, category: "Food", date: "2025-03-09" },
    { amount: 12, category: "Books", date: "2025-03-04" },
    { amount: 99, category: "Fees", date: "2025-03-03" }
  ];
  const week = lastSevenDays(sample, new Date(2025, 2, 10));
  const rates = { baseCurrency: "USD", displayCurrency: "RWF", otherCurrencies: [{ code: "RWF", rate: 1450 }] };
  check("adds up every amount", totalSpent(sample), 123.5);
  check("total of nothing is zero", totalSpent([]), 0);
  check("finds the category with the highest spend", topCategory(sample).name, "Fees");
  check("has no top category without records", topCategory([]), null);
  check("covers seven days", week.length, 7);
  check("starts six days back", week[0].date, "2025-03-04");
  check("ends on today", week[6].date, "2025-03-10");
  check("sums each day", week[6].total + week[5].total + week[0].total, 24.5);
  check("leaves out older records", week.some((day) => day.total === 99), false);
  check("formats a local date", toIsoDate(new Date(2024, 1, 29)), "2024-02-29");
  check("no cap means no status", capStatus(50, null).state, "none");
  check("under the cap", capStatus(50, 80).difference, 30);
  check("exactly on the cap still counts as under", capStatus(80, 80).state, "under");
  check("over the cap", capStatus(90.5, 80).state, "over");
  check("overage is a positive number", capStatus(90.5, 80).difference, 10.5);
  check("converts to the display currency", convertAmount(2, rates), 2900);
  check("leaves the base currency alone", convertAmount(2, { ...rates, displayCurrency: "USD" }), 2);
});

group("Import validation", () => {
  const good = {
    id: "txn_0001",
    description: "Lunch",
    amount: 4.5,
    category: "Food",
    date: "2025-09-29",
    createdAt: "2025-09-29T12:15:00.000Z",
    updatedAt: "2025-09-29T12:15:00.000Z"
  };
  const withChange = (changes) => [{ ...good, ...changes }];
  const withoutField = (field) => {
    const copy = { ...good };
    delete copy[field];
    return [copy];
  };
  check("accepts a well formed list", validateRecords([good]).valid, true);
  check("accepts an amount of zero", validateRecords(withChange({ amount: 0 })).valid, true);
  check("drops fields it does not know", "extra" in validateRecords(withChange({ extra: 1 })).records[0], false);
  check("rejects something that is not a list", validateRecords({ records: [good] }).valid, false);
  check("rejects a list of non objects", validateRecords(["Lunch"]).valid, false);
  check("rejects a missing field", validateRecords(withoutField("category")).valid, false);
  check("rejects a missing timestamp", validateRecords(withoutField("updatedAt")).valid, false);
  check("rejects an amount given as text", validateRecords(withChange({ amount: "4.50" })).valid, false);
  check("rejects a negative amount", validateRecords(withChange({ amount: -1 })).valid, false);
  check("rejects three decimals", validateRecords(withChange({ amount: 1.234 })).valid, false);
  check("rejects a padded description", validateRecords(withChange({ description: " Lunch" })).valid, false);
  check("rejects an impossible date", validateRecords(withChange({ date: "2025-02-30" })).valid, false);
  check("rejects a category with digits", validateRecords(withChange({ category: "Food2" })).valid, false);
  check("rejects a badly shaped id", validateRecords(withChange({ id: "7" })).valid, false);
  check("rejects a timestamp that is only a date", validateRecords(withChange({ createdAt: "2025-09-29" })).valid, false);
  check("rejects repeated ids", validateRecords([good, good]).valid, false);
  check("says which record is wrong", validateRecords([good, { ...good, id: "txn_0002", amount: -1 }]).errors[0].startsWith("Record 2 "), true);
  check("rejects text that is not JSON", parseImport("{oops").errors[0], "The file is not valid JSON.");
  check("rejects an empty list", parseImport("[]").valid, false);
  check("parses a good file", parseImport(JSON.stringify([good])).records.length, 1);
  check("round trips an export", parseImport(recordsToJson([good])).valid, true);
  check("shortens long error lists", summariseErrors(["a", "b", "c", "d", "e"]), "a b c And 2 more.");
});

renderResults();
