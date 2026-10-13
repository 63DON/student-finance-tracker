import {
  getState,
  subscribe,
  updateSettings,
  addCategory,
  renameCategory,
  removeCategory
} from "./state.js";
import {
  validateBudgetCap,
  validateCurrencyCode,
  validateExchangeRate,
  validateCategory
} from "./validators.js";
import { showFieldResult, clearFieldResult, createElement } from "./ui.js";

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

const categoryList = document.querySelector("#categoryList");
const categoryForm = document.querySelector("#categoryForm");
const newCategoryInput = document.querySelector("#newCategoryInput");
const newCategoryError = document.querySelector("#newCategoryError");
const categoryStatus = document.querySelector("#categoryStatus");

let renderedCategories = null;

function buildCategoryItem(name) {
  return createElement("li", { className: "category-item", "data-category": name }, [
    createElement("input", { type: "text", value: name, autocomplete: "off", "aria-label": "Name for " + name }),
    createElement("button", { type: "button", className: "button button-small", "data-action": "rename", "aria-label": "Rename " + name, text: "Rename" }),
    createElement("button", { type: "button", className: "button button-small button-danger", "data-action": "remove", "aria-label": "Remove " + name, text: "Remove" })
  ]);
}

function renderCategories() {
  const { categories } = getState().settings;
  const signature = categories.join("|");
  if (signature === renderedCategories) {
    return;
  }
  renderedCategories = signature;
  categoryList.replaceChildren(...categories.map(buildCategoryItem));
}

function checkCategoryName(name, currentName) {
  if (name === "") {
    return { valid: false, message: "Enter a category name." };
  }
  const result = validateCategory(name);
  if (!result.valid) {
    return result;
  }
  const isTaken = getState().settings.categories.some((existing) => (
    existing !== currentName && existing.toLowerCase() === name.toLowerCase()
  ));
  return isTaken ? { valid: false, message: "That category already exists." } : result;
}

function findCategoryInput(name) {
  const items = Array.from(categoryList.children);
  const item = items.find((entry) => entry.dataset.category === name);
  return item ? item.querySelector("input") : newCategoryInput;
}

function addNewCategory() {
  const name = newCategoryInput.value;
  const result = checkCategoryName(name, null);
  showFieldResult(newCategoryInput, newCategoryError, result);
  if (!result.valid) {
    newCategoryInput.focus();
    return;
  }
  addCategory(name);
  newCategoryInput.value = "";
  clearFieldResult(newCategoryInput, newCategoryError);
  categoryStatus.textContent = "Added " + name + ".";
}

function renameFromItem(item) {
  const oldName = item.dataset.category;
  const input = item.querySelector("input");
  const newName = input.value;
  if (newName === oldName) {
    categoryStatus.textContent = "Type a new name for " + oldName + " first.";
    return;
  }
  const result = checkCategoryName(newName, oldName);
  input.setAttribute("aria-invalid", String(!result.valid));
  if (!result.valid) {
    categoryStatus.textContent = oldName + " was not renamed. " + result.message;
    input.focus();
    return;
  }
  const updatedCount = renameCategory(oldName, newName);
  categoryStatus.textContent = "Renamed " + oldName + " to " + newName + ". Records updated: " + updatedCount + ".";
  findCategoryInput(newName).focus();
}

function removeFromItem(item) {
  const name = item.dataset.category;
  if (getState().settings.categories.length === 1) {
    categoryStatus.textContent = "Keep at least one category.";
    return;
  }
  removeCategory(name);
  categoryStatus.textContent = "Removed " + name + ". Records that used it keep their label.";
  newCategoryInput.focus();
}

function handleCategoryClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }
  const item = button.closest("li");
  if (button.dataset.action === "rename") {
    renameFromItem(item);
  } else {
    removeFromItem(item);
  }
}

function handleCategoryKeys(event) {
  if (event.key === "Enter" && event.target.matches("input")) {
    event.preventDefault();
    renameFromItem(event.target.closest("li"));
  }
}

function initCategories() {
  categoryList.addEventListener("click", handleCategoryClick);
  categoryList.addEventListener("keydown", handleCategoryKeys);
  categoryForm.addEventListener("submit", addNewCategory);
  newCategoryInput.addEventListener("input", () => {
    showFieldResult(newCategoryInput, newCategoryError, checkCategoryName(newCategoryInput.value, null));
  });
}

function handleStateChange(state, change) {
  if (change.type === "load" || change.type === "clear") {
    fillBudgetInput();
    fillCurrencyInputs();
  }
  renderDisplayOptions();
  renderCategories();
}

export function initSettings() {
  budgetCapInput.addEventListener("input", validateBudgetInput);
  budgetForm.addEventListener("submit", saveBudgetCap);
  for (const field of currencyFields) {
    field.input.addEventListener("input", () => validateCurrencyField(field));
  }
  currencyForm.addEventListener("submit", saveCurrencies);
  displayCurrencySelect.addEventListener("change", changeDisplayCurrency);
  initCategories();
  subscribe(handleStateChange);
  handleStateChange(getState(), { type: "load" });
}
