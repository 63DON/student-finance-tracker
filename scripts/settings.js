import { getState, subscribe, updateSettings } from "./state.js";
import { validateBudgetCap, validateCurrencyCode, validateExchangeRate } from "./validators.js";
import { showFieldResult, createElement } from "./ui.js";

const budgetForm = document.querySelector("#budgetForm");
const budgetCapInput = document.querySelector("#budgetCapInput");
const budgetCapError = document.querySelector("#budgetCapError");
const budgetStatus = document.querySelector("#budgetStatus");

function validateBudgetInput() {
  const result = validateBudgetCap(budgetCapInput.value);
  showFieldResult(budgetCapInput, budgetCapError, result);
  return result.valid;
}

function saveBudgetCap() {
  if (!validateBudgetInput()) {
    budgetStatus.textContent = "The cap was not saved. Fix the value first.";
    budgetCapInput.focus();
    return;
  }
  const value = budgetCapInput.value;
  updateSettings({ budgetCap: value === "" ? null : Number(value) });
  budgetStatus.textContent = value === ""
    ? "Cap removed."
    : "Cap saved as " + getState().settings.baseCurrency + " " + value + ".";
}

function fillBudgetInput() {
  const { budgetCap } = getState().settings;
  budgetCapInput.value = budgetCap === null ? "" : String(budgetCap);
}

const currencyForm = document.querySelector("#currencyForm");
const currencyStatus = document.querySelector("#currencyStatus");
const displayCurrencySelect = document.querySelector("#displayCurrencySelect");

const currencyFields = [
  ["baseCurrency", validateCurrencyCode],
  ["otherCode1", validateCurrencyCode],
  ["otherRate1", validateExchangeRate],
  ["otherCode2", validateCurrencyCode],
  ["otherRate2", validateExchangeRate]
].map(([name, validate]) => ({
  input: document.querySelector("#" + name + "Input"),
  error: document.querySelector("#" + name + "Error"),
  validate
}));

const [baseField, firstCodeField, firstRateField, secondCodeField, secondRateField] = currencyFields;

function validateCurrencyField(field) {
  const result = field.validate(field.input.value);
  showFieldResult(field.input, field.error, result);
  return result.valid;
}

function findRepeatedCodeField() {
  const codeFields = [baseField, firstCodeField, secondCodeField];
  const codes = codeFields.map((field) => field.input.value);
  return codeFields.find((field, index) => codes.indexOf(field.input.value) !== index) || null;
}

function stopCurrencySave(field) {
  currencyStatus.textContent = "Currencies were not saved. Fix the marked field first.";
  field.input.focus();
}

function saveCurrencies() {
  const invalidFields = currencyFields.filter((field) => !validateCurrencyField(field));
  if (invalidFields.length > 0) {
    stopCurrencySave(invalidFields[0]);
    return;
  }
  const repeated = findRepeatedCodeField();
  if (repeated) {
    showFieldResult(repeated.input, repeated.error, { valid: false, message: "Each currency needs its own code." });
    stopCurrencySave(repeated);
    return;
  }
  const codes = [baseField, firstCodeField, secondCodeField].map((field) => field.input.value);
  const { displayCurrency } = getState().settings;
  updateSettings({
    baseCurrency: codes[0],
    otherCurrencies: [
      { code: codes[1], rate: Number(firstRateField.input.value) },
      { code: codes[2], rate: Number(secondRateField.input.value) }
    ],
    displayCurrency: codes.includes(displayCurrency) ? displayCurrency : codes[0]
  });
  currencyStatus.textContent = "Currencies saved.";
}

function fillCurrencyInputs() {
  const { baseCurrency, otherCurrencies } = getState().settings;
  baseField.input.value = baseCurrency;
  firstCodeField.input.value = otherCurrencies[0].code;
  firstRateField.input.value = String(otherCurrencies[0].rate);
  secondCodeField.input.value = otherCurrencies[1].code;
  secondRateField.input.value = String(otherCurrencies[1].rate);
}

function renderDisplayOptions() {
  const { baseCurrency, otherCurrencies, displayCurrency } = getState().settings;
  const codes = [baseCurrency, ...otherCurrencies.map((currency) => currency.code)];
  displayCurrencySelect.replaceChildren(...codes.map((code) => createElement("option", {
    value: code,
    text: code === baseCurrency ? code + " (base)" : code
  })));
  displayCurrencySelect.value = displayCurrency;
}

function changeDisplayCurrency() {
  updateSettings({ displayCurrency: displayCurrencySelect.value });
  currencyStatus.textContent = "Amounts are now shown in " + displayCurrencySelect.value + ".";
}

function handleStateChange(state, change) {
  if (change.type === "load" || change.type === "clear") {
    fillBudgetInput();
    fillCurrencyInputs();
  }
  renderDisplayOptions();
}

export function initSettings() {
  budgetCapInput.addEventListener("input", validateBudgetInput);
  budgetForm.addEventListener("submit", saveBudgetCap);
  for (const field of currencyFields) {
    field.input.addEventListener("input", () => validateCurrencyField(field));
  }
  currencyForm.addEventListener("submit", saveCurrencies);
  displayCurrencySelect.addEventListener("change", changeDisplayCurrency);
  subscribe(handleStateChange);
  handleStateChange(getState(), { type: "load" });
}
